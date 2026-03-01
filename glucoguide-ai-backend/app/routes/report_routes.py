from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ClinicalReport, LifestylePlan, DailyLog
from app.firebase_auth import get_current_user
from app.agent.pdf_extractor import extract_text_from_pdf
from app.agent.extraction_node import extract_clinical_data
from app.agent.plan_node import generate_protocol
from app.agent.daily_recommendation_node import generate_daily_recommendations
import io

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/upload")
async def process_report_endpoint(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    try:
        # 1. Read PDF
        contents = await file.read()
        pdf_file = io.BytesIO(contents)

        # 2. Extract Text
        raw_text = extract_text_from_pdf(pdf_file)

        # 3. Extract Clinical Data
        clinical_data = extract_clinical_data(raw_text)

        # Helper functions for data cleaning
        def safe_float(val):
            if val is None:
                return None
            if isinstance(val, (int, float)):
                return float(val)
            if isinstance(val, str):
                # Remove non-numeric characters except dot
                import re
                clean = re.sub(r'[^\d.]', '', val)
                try:
                    return float(clean)
                except ValueError:
                    return None
            return None

        def format_bp(val):
            if val is None: 
                return None
            if isinstance(val, str):
                return val
            if isinstance(val, dict):
                s = val.get('systolic')
                d = val.get('diastolic')
                if s and d:
                    return f"{s}/{d}"
            return str(val)

        # 4. Save clinical report
        new_report = ClinicalReport(
            user_id=user.id,
            hba1c=safe_float(clinical_data.get("hba1c")),
            fbs=safe_float(clinical_data.get("fasting_glucose")),
            triglycerides=safe_float(clinical_data.get("triglycerides")),
            hdl=safe_float(clinical_data.get("hdl")),
            bmi=safe_float(clinical_data.get("bmi")),
            blood_pressure=format_bp(clinical_data.get("blood_pressure"))
        )

        # 5. Save to Database
        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        # 6. Generate lifestyle plan (Protocol + Daily Recs)
        plan_json = generate_protocol(clinical_data)

        # 6a. Generate Daily Recommendations (Optimized: Calculate once on upload)
        # Fetch recent logs first for context
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

        daily_rec_plan = generate_daily_recommendations(clinical_data, log_history)
        
        # Merge into the plan JSON so it's persisted in the DB
        plan_json["daily_recommendations"] = daily_rec_plan

        # 7. Save lifestyle plan
        new_plan = LifestylePlan(
            user_id=user.id,
            report_id=new_report.id,
            plan_json=plan_json
        )

        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)   

        return {
            "clinical_data": clinical_data,
            "plan": plan_json
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
