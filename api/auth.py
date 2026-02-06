"""Authentication utilities: JWT tokens, password hashing."""
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import hashlib
import logging

from config import settings
from models.database import get_db, User

logger = logging.getLogger(__name__)

# Try bcrypt, fallback to sha256 for hackathon
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Test that bcrypt actually works (bcrypt 5.x changed API)
    _test_hash = pwd_context.hash("test")
    pwd_context.verify("test", _test_hash)
    USE_BCRYPT = True
    logger.info("✅ Using bcrypt for password hashing")
except Exception as e:
    USE_BCRYPT = False
    logger.warning(f"⚠️ bcrypt not available ({e}), using sha256 fallback")

security = HTTPBearer()


def hash_password(password: str) -> str:
    if USE_BCRYPT:
        return pwd_context.hash(password)
    # SHA256 fallback (acceptable for hackathon)
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    if USE_BCRYPT:
        return pwd_context.verify(plain, hashed)
    return hashlib.sha256(plain.encode()).hexdigest() == hashed


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def require_recruiter(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required")
    return user
