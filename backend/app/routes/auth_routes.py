from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, UserResponse, UserProfileUpdate, OTPVerifyRequest
from app.auth import (
    hash_password,
    verify_password,
    create_session_token,
    generate_csrf_token,
    get_current_user,
    verify_csrf,
)
from app.config import settings
from app.services.otp_service import generate_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_auth_cookies(response: Response, user_id: int) -> str:
    """Sets HttpOnly session cookie and readable CSRF cookie."""
    session_token = create_session_token(user_id)
    csrf_token = generate_csrf_token()

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    return csrf_token

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: UserRegister,
    response: Response,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this college email already exists.",
        )

    hashed = hash_password(data.password)
    user = User(
        email=data.email.lower(),
        display_name=data.display_name,
        hashed_password=hashed,
        college_id=data.college_id,
        campus_location=data.campus_location,
        bio=data.bio,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Registration logs the user in immediately (no OTP needed for registration)
    set_auth_cookies(response, user.id)
    return user


@router.post("/login")
def login_step_1(
    data: UserLogin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )

    # Generate OTP and "send" to terminal
    generate_otp(user.email)
    
    # DO NOT set cookies yet! Return require_otp flag.
    return {
        "require_otp": True,
        "email": user.email,
        "message": "Password verified. OTP sent."
    }


@router.post("/verify-otp", response_model=UserResponse)
def login_step_2(
    data: OTPVerifyRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if not verify_otp(data.email, data.code):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
        
    # OTP correct! Set cookies and return user
    set_auth_cookies(response, user.id)
    return user


@router.post("/logout")
def logout(response: Response, _user: User = Depends(get_current_user)):
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(key=settings.CSRF_COOKIE_NAME, path="/")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse, dependencies=[Depends(verify_csrf)])
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.display_name is not None:
        current_user.display_name = data.display_name.strip()
    if data.college_id is not None:
        current_user.college_id = data.college_id.strip() or None
    if data.campus_location is not None:
        current_user.campus_location = data.campus_location.strip() or None
    if data.bio is not None:
        current_user.bio = data.bio.strip() or None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/csrf")
def get_csrf(response: Response):
    token = generate_csrf_token()
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    return {"csrf_token": token}