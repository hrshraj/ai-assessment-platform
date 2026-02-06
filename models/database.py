"""
Database Models
================
SQLAlchemy models for persistent storage.
Uses SQLite for hackathon simplicity (swap to PostgreSQL for production).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, String, Float, Integer, Boolean,
    Text, JSON, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_uuid():
    return str(uuid.uuid4())


# ─── Models ────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="candidate")  # "candidate", "recruiter", "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String, primary_key=True, default=generate_uuid)
    recruiter_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    parsed_data = Column(JSON)  # Stores ParsedJD as JSON
    status = Column(String, default="active")  # "active", "draft", "closed"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    assessments = relationship("AssessmentRecord", back_populates="job_description")


class AssessmentRecord(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, default=generate_uuid)
    jd_id = Column(String, ForeignKey("job_descriptions.id"), nullable=False)
    title = Column(String, nullable=False)
    questions_data = Column(JSON)  # Full Assessment object as JSON
    duration_minutes = Column(Integer, default=90)
    cutoff_percentage = Column(Float, default=50.0)
    difficulty_config = Column(JSON)
    total_points = Column(Float)
    status = Column(String, default="active")  # "active", "closed", "draft"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    job_description = relationship("JobDescription", back_populates="assessments")
    submissions = relationship("CandidateSubmission", back_populates="assessment")


class CandidateSubmission(Base):
    __tablename__ = "candidate_submissions"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False)
    responses = Column(JSON)  # All answers
    response_timings = Column(JSON)  # Per-question timing data
    evaluation_data = Column(JSON)  # CandidateEvaluation as JSON
    anti_cheat_data = Column(JSON)  # AntiCheatReport as JSON
    total_score = Column(Float)
    percentage = Column(Float)
    status = Column(String, default="in_progress")  # "in_progress", "submitted", "evaluated"
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime)
    evaluated_at = Column(DateTime)

    assessment = relationship("AssessmentRecord", back_populates="submissions")


class CandidateResume(Base):
    __tablename__ = "candidate_resumes"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    raw_text = Column(Text)
    parsed_data = Column(JSON)  # ParsedResume as JSON
    file_name = Column(String)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created.")
