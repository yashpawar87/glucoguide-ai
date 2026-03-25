from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import ClinicalReport, LifestylePlan, DailyLog, Medication
from app.firebase_auth import get_current_user
from app.agent.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


def build_user_context(user, db: Session) -> str:
    """Build a comprehensive health context string from user data."""
    parts = []

    # 1. Latest Clinical Report
    latest_report = (
        db.query(ClinicalReport)
        .filter(ClinicalReport.user_id == user.id)
        .order_by(ClinicalReport.created_at.desc())
        .first()
    )
    if latest_report:
        parts.append(
            f"Latest Clinical Report (Date: {latest_report.created_at.strftime('%Y-%m-%d') if latest_report.created_at else 'N/A'}):\n"
            f"  - HbA1c: {latest_report.hba1c}%\n"
            f"  - Fasting Blood Sugar: {latest_report.fbs} mg/dL\n"
            f"  - Triglycerides: {latest_report.triglycerides} mg/dL\n"
            f"  - HDL: {latest_report.hdl} mg/dL\n"
            f"  - BMI: {latest_report.bmi or 'Not recorded'}\n"
            f"  - Blood Pressure: {latest_report.blood_pressure or 'Not recorded'}"
        )
    else:
        parts.append("No clinical reports uploaded yet.")

    # 2. Latest Lifestyle Plan
    latest_plan = (
        db.query(LifestylePlan)
        .filter(LifestylePlan.user_id == user.id)
        .order_by(LifestylePlan.created_at.desc())
        .first()
    )
    if latest_plan and latest_plan.plan_json:
        import json
        plan = latest_plan.plan_json
        if isinstance(plan, str):
            plan = json.loads(plan)

        risk = plan.get("risk_analysis", {})
        if risk:
            parts.append(
                f"\nRisk Analysis:\n"
                f"  - Primary Risk: {risk.get('primary_risk', 'N/A')}\n"
                f"  - Severity: {risk.get('severity', 'N/A')}\n"
                f"  - Priority Level: {risk.get('priority_level', 'N/A')}"
            )

        restrictions = plan.get("restrictions", [])
        if restrictions:
            restriction_lines = "\n".join(
                f"  - {r.get('type', 'N/A')}: {r.get('reason', '')}"
                for r in restrictions
            )
            parts.append(f"\nDietary/Lifestyle Restrictions:\n{restriction_lines}")

        daily_recs = plan.get("daily_recommendations", {})
        if daily_recs:
            nutrition = daily_recs.get("nutrition", {})
            if nutrition:
                eat = ", ".join(nutrition.get("eat", []))
                avoid = ", ".join(nutrition.get("avoid", []))
                parts.append(
                    f"\nNutrition Plan:\n"
                    f"  - Recommended Foods: {eat or 'None specified'}\n"
                    f"  - Foods to Avoid: {avoid or 'None specified'}"
                )
            movement = daily_recs.get("movement", {})
            if movement:
                parts.append(
                    f"\nMovement Plan:\n"
                    f"  - Type: {movement.get('target_type', 'N/A')}\n"
                    f"  - Daily Goal: {movement.get('daily_goal', 'N/A')}\n"
                    f"  - Intensity: {movement.get('intensity', 'N/A')}"
                )

    # 3. Recent Daily Logs (last 7 days)
    recent_logs = (
        db.query(DailyLog)
        .filter(DailyLog.user_id == user.id)
        .order_by(DailyLog.date.desc())
        .limit(7)
        .all()
    )
    if recent_logs:
        log_lines = []
        for log in recent_logs:
            date_str = log.date.strftime("%Y-%m-%d") if log.date else "N/A"
            log_lines.append(
                f"  {date_str}: Steps={log.steps or 0}, Water={log.water_intake or 0} glasses, "
                f"Exercise={log.exercise_minutes or 0} min, Sleep={log.sleep_hours or 'N/A'} hrs, "
                f"Fasting Glucose={log.fasting_glucose or 'N/A'} mg/dL, "
                f"Diet Score={log.diet_score or 'N/A'}/10, "
                f"Adherence={log.adherence_score or 'N/A'}%"
            )
        parts.append(f"\nRecent Daily Logs (Last 7 days):\n" + "\n".join(log_lines))
    else:
        parts.append("\nNo daily logs recorded yet.")

    # 4. Current Medications
    medications = (
        db.query(Medication)
        .filter(Medication.user_id == user.id)
        .all()
    )
    if medications:
        med_lines = "\n".join(
            f"  - {m.name} ({m.dosage or 'N/A'}), {m.frequency or 'N/A'}, Time: {m.time or 'N/A'}, Taken Today: {'Yes' if m.taken_today else 'No'}"
            for m in medications
        )
        parts.append(f"\nCurrent Medications:\n{med_lines}")
    else:
        parts.append("\nNo medications tracked.")

    return "\n".join(parts)


SYSTEM_PROMPT = """You are GlucoGuide AI — a friendly, knowledgeable health assistant specializing in diabetes management and metabolic health.

You have access to the user's complete health profile below. Use this data to give personalized, actionable answers.

IMPORTANT RULES:
1. Always ground your responses in the user's actual data when relevant.
2. Be empathetic, encouraging, and concise.
3. If the user's data shows concerning values, mention them gently and suggest consulting their doctor.
4. Use Indian context for diet suggestions (e.g., roti, dal, methi, curd) when giving nutrition advice.
5. Never diagnose conditions — you are a wellness assistant, not a doctor.
6. If the user asks about something not in their data, say so clearly.
7. Keep responses under 250 words unless the user asks for detail.

USER HEALTH PROFILE:
{context}
"""


@router.post("/message", response_model=ChatResponse)
def chat_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        context = build_user_context(user, db)
        llm = get_llm()

        messages = [
            SystemMessage(content=SYSTEM_PROMPT.format(context=context)),
            HumanMessage(content=req.message),
        ]

        response = llm.invoke(messages)
        return ChatResponse(reply=response.content.strip())

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
