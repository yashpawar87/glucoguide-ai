from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models  
from app.firebase_auth import get_current_user
from app.routes import report_routes, log_routes, recommendation_routes, medication_routes, chat_routes

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(report_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(log_routes.router)
app.include_router(medication_routes.router)
app.include_router(chat_routes.router)

@app.get("/")
def read_root():
    return {"message": "backend is working "}

@app.get("/me")
def get_me(user = Depends(get_current_user)):
    return {
        "id": user.id,
        "firebase_uid": user.firebase_uid,
        "email": user.email
    }
