from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid =Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship('ClinicalReport', back_populates='user')
    plans = relationship("LifestylePlan", back_populates="user")
    medications = relationship("Medication", back_populates="user")

class ClinicalReport(Base):
    __tablename__ = 'clinical_reports'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    hba1c = Column(Float, nullable=False)
    fbs = Column(Float, nullable=False)
    triglycerides = Column(Float, nullable=False)
    hdl = Column(Float, nullable=False)
    bmi = Column(Float, nullable=True)
    blood_pressure = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', back_populates='reports')
    plan = relationship('LifestylePlan', back_populates='report', uselist=False)

class LifestylePlan(Base):
    __tablename__ = 'lifestyle_plans'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    report_id = Column(Integer, ForeignKey('clinical_reports.id'))
    plan_json = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False, server_default=text("1"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', back_populates='plans')
    report = relationship('ClinicalReport', back_populates='plan', uselist=False)

class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    steps = Column(Integer, default=0, nullable=True)
    water_intake = Column(Integer, default=0, nullable=True)

    exercise_minutes = Column(Integer, nullable=True)
    sleep_hours = Column(Float, nullable=True)
    alcohol_units = Column(Float, nullable=True)
    fasting_glucose = Column(Float, nullable=True)
    diet_score = Column(Integer, nullable=True)

    adherence_score = Column(Float, nullable=True)

    user = relationship("User")

class Medication(Base):
    __tablename__ = 'medications'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    time = Column(String, nullable=True)
    taken_today = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="medications")
