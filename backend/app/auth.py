import secrets
from typing import Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.config import settings
from app.db import get_db
from app.models import User

# Argon2 Password Hasher
ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MB
    parallelism=2,
    hash_len=32,
    salt_len=16,
)

# Serializer for signed, expiring session cookies
session_serializer = URLSafeTimedSerializer(
    secret_key=settings.SESSION_SECRET_KEY,
    salt="reloop-session-salt-2026",
)

def hash_password(password: str) -> str:
    """Hashes password using Argon2id algorithm."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against Argon2 hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

def create_session_token(user_id: int) -> str:
    """Generates a cryptographically signed, timestamped session token."""
    return session_serializer.dumps({"user_id": user_id})

def decode_session_token(token: str) -> Optional[int]:
    """Decodes and validates a session token against expiration and tampering."""
    try:
        data = session_serializer.loads(token, max_age=settings.SESSION_MAX_AGE_SECONDS)
        return data.get("user_id")
    except (SignatureExpired, BadSignature, Exception):
        return None

def generate_csrf_token() -> str:
    """Generates a cryptographically secure random CSRF token."""
    return secrets.token_urlsafe(32)

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Enforces authentication via signed HttpOnly session cookie.
    Raises 401 if missing, invalid, or expired.
    """
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        # Also check Authorization: Bearer for automated testing or headless clients
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ", 1)[1]

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. No session found.",
        )

    user_id = decode_session_token(session_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please log in again.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or no longer exists.",
        )

    return user

def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Returns the authenticated user if session cookie is valid, or None."""
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ", 1)[1]

    if not session_token:
        return None

    user_id = decode_session_token(session_token)
    if not user_id:
        return None

    return db.query(User).filter(User.id == user_id, User.is_active == True).first()

def verify_csrf(request: Request):
    """
    Validates CSRF token on state-modifying requests (POST, PUT, DELETE, PATCH).
    Exempts safe methods (GET, HEAD, OPTIONS).
    """
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    csrf_cookie = request.cookies.get(settings.CSRF_COOKIE_NAME)
    csrf_header = request.headers.get("X-CSRF-Token")

    # If requests use Bearer token (non-cookie testing), skip cookie-based CSRF
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return

    # In development or if cookie is set, verify header matches cookie
    if csrf_cookie and csrf_header:
        if not secrets.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token mismatch.",
            )
    elif csrf_cookie and not csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing X-CSRF-Token header.",
        )
