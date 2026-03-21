# app/utils/database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Float, Boolean, DateTime, Integer, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import pandas as pd
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# New standalone table for the LSTM Backend
class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    date = Column(String)
    timestamp_str = Column(String)  # Stores the HH:MM:SS
    timestamp_dt = Column(DateTime, default=datetime.utcnow) # For sorting
    is_weekend = Column(Boolean)
    is_holiday = Column(Boolean)
    max_capacity = Column(Integer)
    temperature = Column(Float)
    humidity = Column(Float)
    power_consumption = Column(Float)
    predicted_output = Column(Float, nullable=True) # The "Output Column"

# Create the table if it doesn't exist
Base.metadata.create_all(bind=engine)

def add_new_record(data, prediction=None):
    """Saves the incoming JSON object and the prediction to the new table."""
    db = SessionLocal()
    try:
        # Combine date and timestamp strings for a sortable datetime object
        dt_str = f"{data['date']} {data['timestamp']}"
        dt_obj = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')

        new_entry = PredictionRecord(
            company_name=data['company_name'],
            date=data['date'],
            timestamp_str=data['timestamp'],
            timestamp_dt=dt_obj,
            is_weekend=data['is_weekend'],
            is_holiday=data['is_holiday'],
            max_capacity=data['max_capacity'],
            temperature=data['temperature'],
            humidity=data['humidity'],
            power_consumption=data['power_consumption'],
            predicted_output=prediction
        )
        db.add(new_entry)
        db.commit()
    finally:
        db.close()

def get_recent_history(company_name, limit=48):
    """Fetches history from the new prediction_records table."""
    query = text("""
        SELECT 
            is_weekend, is_holiday, max_capacity, temperature, 
            humidity, power_consumption, timestamp_dt as timestamp
        FROM prediction_records
        WHERE company_name = :company
        ORDER BY timestamp_dt DESC
        LIMIT :limit
    """)
    
    with engine.connect() as connection:
        df = pd.read_sql(query, connection, params={"company": company_name, "limit": limit})
    
    return df.iloc[::-1].reset_index(drop=True)