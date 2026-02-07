"""Centralized configuration loaded from .env"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # LLM Provider: "ollama" or "groq"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")

    # Ollama (local)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    OLLAMA_CODING_MODEL: str = os.getenv("OLLAMA_CODING_MODEL", "llama3")

    # Groq (cloud - free tier)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_CODING_MODEL: str = os.getenv("GROQ_CODING_MODEL", "llama-3.1-8b-instant")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./assessment.db")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "hackathon-secret")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

    # Assessment defaults
    DEFAULT_MCQ_COUNT: int = int(os.getenv("DEFAULT_MCQ_COUNT", "10"))
    DEFAULT_SUBJECTIVE_COUNT: int = int(os.getenv("DEFAULT_SUBJECTIVE_COUNT", "5"))
    DEFAULT_CODING_COUNT: int = int(os.getenv("DEFAULT_CODING_COUNT", "3"))
    DEFAULT_ASSESSMENT_DURATION: int = int(os.getenv("DEFAULT_ASSESSMENT_DURATION_MINUTES", "90"))
    MAX_CODE_EXEC_TIME: int = int(os.getenv("MAX_CODE_EXECUTION_TIME_SECONDS", "10"))

    # Anti-cheat
    PLAGIARISM_THRESHOLD: float = float(os.getenv("PLAGIARISM_THRESHOLD", "0.85"))
    MIN_TIME_PER_QUESTION: int = int(os.getenv("MIN_TIME_PER_QUESTION_SECONDS", "5"))
    RESUME_MISMATCH_THRESHOLD: float = float(os.getenv("RESUME_MISMATCH_THRESHOLD", "0.4"))

    # Embedding
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")


settings = Settings()
