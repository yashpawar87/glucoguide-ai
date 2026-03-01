import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL) #Connects to PostgreSQL.

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)  #Creates database sessions per request.

Base = declarative_base() #All ORM models inherit from this.

def get_db(): #Dependency injection for FastAPI routes.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() #Closes the database session after request. 