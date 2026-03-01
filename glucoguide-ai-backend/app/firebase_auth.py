import firebase_admin
from firebase_admin import credentials, auth 
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User 

#initialize firebase admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred) 

security = HTTPBearer() 

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db) 
):
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email', '')
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    #check if user exists in DB
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()

    #auto create user if not exists
    if not user:
        user = User(
            firebase_uid=firebase_uid, 
            email=email
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user