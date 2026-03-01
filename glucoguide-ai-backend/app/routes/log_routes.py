from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DailyLog
from app.utils.scoring import calculate_adherence
from app.firebase_auth import get_current_user
from app.agent.feedback_node import generate_feedback
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/logs", tags=["Logs"])

class LogCreate(BaseModel):
    exercise_minutes: Optional[int] = None
    steps: Optional[int] = 0
    water_intake: Optional[int] = 0
    sleep_hours: Optional[float] = None
    alcohol_units: Optional[float] = None
    fasting_glucose: Optional[float] = None
    diet_score: Optional[int] = None

class LogResponse(LogCreate):
    id: int
    user_id: int
    date: datetime
    steps: Optional[int] = 0
    water_intake: Optional[int] = 0
    adherence_score: Optional[float] = None

    class Config:
        orm_mode = True

@router.post("/", response_model=LogResponse)
def create_log(
    log: LogCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    import datetime
    
    # Check if log exists for today
    today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_log = db.query(DailyLog).filter(DailyLog.user_id == user.id, DailyLog.date >= today_start).first()

    if existing_log:
        # Update existing log
        if log.exercise_minutes is not None: existing_log.exercise_minutes = log.exercise_minutes
        if log.steps is not None and log.steps > 0: existing_log.steps = log.steps
        if log.water_intake is not None and log.water_intake > 0: existing_log.water_intake = log.water_intake
        if log.sleep_hours is not None: existing_log.sleep_hours = log.sleep_hours
        if log.alcohol_units is not None: existing_log.alcohol_units = log.alcohol_units
        if log.fasting_glucose is not None: existing_log.fasting_glucose = log.fasting_glucose
        if log.diet_score is not None: existing_log.diet_score = log.diet_score
        
        existing_log.adherence_score = calculate_adherence(existing_log)
        db.commit()
        db.refresh(existing_log)
        return existing_log

    new_log = DailyLog(
        user_id=user.id,
        exercise_minutes=log.exercise_minutes,
        steps=log.steps,
        water_intake=log.water_intake,
        sleep_hours=log.sleep_hours,
        alcohol_units=log.alcohol_units,
        fasting_glucose=log.fasting_glucose,
        diet_score=log.diet_score
    )

    new_log.adherence_score = calculate_adherence(new_log)

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log

@router.get("/history", response_model=List[LogResponse])
def get_log_history(
    limit: int = 7,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get recent logs for history view"""
    logs = db.query(DailyLog)\
        .filter(DailyLog.user_id == user.id)\
        .order_by(DailyLog.date.desc())\
        .limit(limit)\
        .all()
    return logs

@router.get("/weekly")
def weekly_summary(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    logs = db.query(DailyLog)\
        .filter(DailyLog.user_id == user.id)\
        .order_by(DailyLog.date.desc())\
        .limit(7)\
        .all()

    if not logs:
        return {"message": "No logs available"}

    avg_score = sum(log.adherence_score for log in logs) / len(logs)

    if avg_score >= 80:
        trend = "Improving"
    elif avg_score >= 50:
        trend = "Stable"
    else:
        trend = "Declining"

    return {
        "average_adherence": round(avg_score, 2),
        "trend": trend
    }

@router.get("/feedback")
def weekly_feedback(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    logs = db.query(DailyLog)\
        .filter(DailyLog.user_id == user.id)\
        .order_by(DailyLog.date.desc())\
        .limit(7)\
        .all()

    if not logs:
        return {"message": "No logs available"}

    avg_score = sum(log.adherence_score for log in logs) / len(logs)

    if avg_score >= 80:
        trend = "Improving"
    elif avg_score >= 50:
        trend = "Stable"
    else:
        trend = "Declining"

    feedback = generate_feedback(trend, avg_score)

    return {
        "trend": trend,
        "average_adherence": round(avg_score, 2),
        "feedback": feedback
    }
