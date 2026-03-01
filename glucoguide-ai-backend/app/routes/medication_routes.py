from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Medication
from app.firebase_auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/medications", tags=["Medications"])

class MedicationBase(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = "Daily"
    time: Optional[str] = None

class MedicationCreate(MedicationBase):
    pass

class MedicationResponse(MedicationBase):
    id: int
    user_id: int
    taken_today: bool

    class Config:
        orm_mode = True

@router.get("/", response_model=list[MedicationResponse])
def get_medications(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return db.query(Medication).filter(Medication.user_id == user.id).all()

@router.post("/", response_model=MedicationResponse)
def add_medication(
    med: MedicationCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    new_med = Medication(
        user_id=user.id,
        name=med.name,
        dosage=med.dosage,
        frequency=med.frequency,
        time=med.time
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

@router.put("/{med_id}/toggle", response_model=MedicationResponse)
def toggle_medication(
    med_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    med = db.query(Medication).filter(Medication.id == med_id, Medication.user_id == user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    med.taken_today = not med.taken_today
    db.commit()
    db.refresh(med)
    return med

@router.delete("/{med_id}")
def delete_medication(
    med_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    med = db.query(Medication).filter(Medication.id == med_id, Medication.user_id == user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    db.delete(med)
    db.commit()
    return {"message": "Medication deleted"}
