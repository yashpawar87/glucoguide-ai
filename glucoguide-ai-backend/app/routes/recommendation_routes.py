from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ClinicalReport, DailyLog, LifestylePlan
from app.firebase_auth import get_current_user
from app.agent.daily_recommendation_node import generate_daily_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


# Empty fallback structure
EMPTY_RECOMMENDATIONS = {
    "nutrition": {
        "eat": [],
        "avoid": [],
        "ai_reasoning": "No data available. Please upload a clinical report."
    },
    "movement": {
        "target_type": "None",
        "daily_goal": "0 mins",
        "intensity": "None",
        "clinical_logic": "No clinical data available."
    },
    "actions": []
}


@router.get("/daily")
def get_daily_recommendations(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Generate AI-powered daily recommendations based on the user's
    latest clinical report and recent daily logs.
    """

    # Get latest clinical report
    latest_report = db.query(ClinicalReport) \
        .filter(ClinicalReport.user_id == user.id) \
        .order_by(ClinicalReport.created_at.desc()) \
        .first()

    if not latest_report:
        # No clinical data yet — return empty state
        return {
            "source": "empty",
            "recommendations": EMPTY_RECOMMENDATIONS
        }

    # Build clinical data dict from report
    clinical_data = {
        "hba1c": latest_report.hba1c,
        "fasting_glucose": latest_report.fbs,
        "triglycerides": latest_report.triglycerides,
        "hdl": latest_report.hdl,
        "bmi": latest_report.bmi,
        "blood_pressure": latest_report.blood_pressure,
    }

    # Also pull medication info from existing lifestyle plan if available
    latest_plan = db.query(LifestylePlan) \
        .filter(LifestylePlan.user_id == user.id) \
        .order_by(LifestylePlan.created_at.desc()) \
        .first()

    if latest_plan and latest_plan.plan_json:
        plan = latest_plan.plan_json
        if isinstance(plan, str):
            import json
            plan = json.loads(plan)
        
        # OPTIMIZATION: Check if daily recommendations are already cached in the plan
        if "daily_recommendations" in plan:
            return {
                "source": "ai_cached",
                "clinical_snapshot": {
                    "triglycerides": latest_report.triglycerides,
                    "hba1c": latest_report.hba1c,
                    "hdl": latest_report.hdl,
                    "fasting_glucose": latest_report.fbs,
                },
                "recommendations": plan["daily_recommendations"]
            }

        # Add medication context from the plan (Legacy fallback)
        clinical_data["existing_plan"] = {
            "risk_analysis": plan.get("risk_analysis", {}),
            "routine": plan.get("routine", []),
            "restrictions": plan.get("restrictions", []),
        }

    # Get last 7 daily logs
    recent_logs = db.query(DailyLog) \
        .filter(DailyLog.user_id == user.id) \
        .order_by(DailyLog.date.desc()) \
        .limit(7) \
        .all()

    log_history = []
    for log in recent_logs:
        log_history.append({
            "date": log.date.strftime("%Y-%m-%d") if log.date else "N/A",
            "exercise_minutes": log.exercise_minutes,
            "sleep_hours": log.sleep_hours,
            "fasting_glucose": log.fasting_glucose,
            "diet_score": log.diet_score,
            "alcohol_units": log.alcohol_units,
            "adherence_score": log.adherence_score,
        })

    try:
        recommendations = generate_daily_recommendations(clinical_data, log_history)
        return {
            "source": "ai",
            "clinical_snapshot": {
                "triglycerides": latest_report.triglycerides,
                "hba1c": latest_report.hba1c,
                "hdl": latest_report.hdl,
                "fasting_glucose": latest_report.fbs,
            },
            "recommendations": recommendations
        }
    except Exception as e:
        # Fallback to defaults if AI fails
        return {
            "source": "error",
            "error": str(e),
            "recommendations": EMPTY_RECOMMENDATIONS
        }
