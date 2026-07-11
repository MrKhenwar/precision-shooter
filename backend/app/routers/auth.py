"""Auth endpoints: register, OTP verify/resend, login (device-bound), refresh, me."""

import re
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.audit import audit
from ..core.config import settings
from ..core.database import get_db
from ..core.deps import get_current_user
from ..core.security import (
    create_access_token, create_refresh_token, decode_token, hash_password, verify_password,
)
from ..models import OTPCode, User
from ..serializers import user_dict

router = APIRouter(prefix="/auth", tags=["auth"])

PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$")


class RegisterIn(BaseModel):
    persona: str
    password: str
    first_name: str = ""
    last_name: str = ""
    email: str | None = None
    mobile: str | None = None
    expert_type: str = ""
    pii_consent: bool = False  # NFR-004 DPDP consent
    ai_consent: bool = False


class OTPVerifyIn(BaseModel):
    identifier: str
    code: str


class ResendIn(BaseModel):
    identifier: str


class LoginIn(BaseModel):
    identifier: str
    password: str
    device_id: str
    recaptcha_token: str = ""


async def _find_user(db: AsyncSession, identifier: str) -> User | None:
    identifier = (identifier or "").strip()
    if not identifier:
        return None
    if "@" in identifier:
        stmt = select(User).where(func.lower(User.email) == identifier.lower())
    else:
        stmt = select(User).where(User.mobile == identifier)
    return (await db.execute(stmt)).scalar_one_or_none()


def _verify_recaptcha(token: str) -> bool:
    if settings.DEBUG or not settings.RECAPTCHA_SECRET_KEY:
        return True
    import json, urllib.parse, urllib.request
    try:
        data = urllib.parse.urlencode({"secret": settings.RECAPTCHA_SECRET_KEY, "response": token}).encode()
        with urllib.request.urlopen("https://www.google.com/recaptcha/api/siteverify", data=data, timeout=5) as r:
            res = json.loads(r.read().decode())
        return bool(res.get("success")) and res.get("score", 0) >= 0.5
    except Exception:
        return False


async def _issue_otp(db: AsyncSession, user: User) -> str:
    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(OTPCode(user_id=user.id, code=code))
    await db.commit()
    return code


async def _issue_tokens(db: AsyncSession, user: User, device_id: str) -> dict:
    user.active_device_id = device_id
    await db.commit()
    return {
        "access": create_access_token(user.id, user.persona, device_id),
        "refresh": create_refresh_token(user.id, user.persona, device_id),
    }


@router.post("/register/", status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    if not body.email and not body.mobile:
        raise HTTPException(400, "Provide an email or a mobile number to register.")
    if body.persona == "expert" and not body.expert_type:
        raise HTTPException(400, "expert_type is required for the External Expert persona.")
    if not PASSWORD_RE.match(body.password):
        raise HTTPException(400, "Password must be 8+ chars with upper, lower, number and special character.")
    if body.email and (await _find_user(db, body.email)):
        raise HTTPException(400, "A user with this email already exists.")
    if body.mobile and (await _find_user(db, body.mobile)):
        raise HTTPException(400, "A user with this mobile already exists.")

    user = User(
        email=(body.email or None), mobile=(body.mobile or None),
        first_name=body.first_name, last_name=body.last_name,
        persona=body.persona, expert_type=body.expert_type,
        password=hash_password(body.password),
        pii_consent=body.pii_consent, ai_consent=body.ai_consent,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    code = await _issue_otp(db, user)
    payload = {"user": user_dict(user), "message": "Registered. Verify the OTP sent to your email/mobile."}
    if settings.DEBUG:
        payload["debug_otp"] = code
    return payload


@router.post("/verify-otp/")
async def verify_otp(body: OTPVerifyIn, db: AsyncSession = Depends(get_db)):
    user = await _find_user(db, body.identifier)
    if not user:
        raise HTTPException(404, "User not found.")
    otp = (await db.execute(
        select(OTPCode).where(OTPCode.user_id == user.id, OTPCode.consumed_at.is_(None))
        .order_by(OTPCode.created_at.desc())
    )).scalars().first()
    if not otp:
        raise HTTPException(400, "OTP expired. Please request a new one.")
    created = otp.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > created + timedelta(seconds=settings.OTP_EXPIRY_SECONDS):
        raise HTTPException(400, "OTP expired. Please request a new one.")
    if otp.code != body.code.strip():
        raise HTTPException(400, "Invalid OTP.")
    otp.consumed_at = datetime.now(timezone.utc)
    user.is_verified = True
    await db.commit()
    return {"message": "Account verified. You can now log in."}


@router.post("/resend-otp/")
async def resend_otp(body: ResendIn, db: AsyncSession = Depends(get_db)):
    user = await _find_user(db, body.identifier)
    if not user:
        raise HTTPException(404, "User not found.")
    since = datetime.now(timezone.utc) - timedelta(hours=1)
    count = (await db.execute(
        select(func.count(OTPCode.id)).where(OTPCode.user_id == user.id, OTPCode.created_at >= since)
    )).scalar_one()
    if count >= settings.OTP_MAX_RESENDS_PER_HOUR:
        raise HTTPException(429, "Too many OTP requests. Try again later.")
    code = await _issue_otp(db, user)
    payload = {"message": "A new OTP has been sent."}
    if settings.DEBUG:
        payload["debug_otp"] = code
    return payload


@router.post("/login/")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    if not _verify_recaptcha(body.recaptcha_token):
        raise HTTPException(400, "reCAPTCHA verification failed.")
    user = await _find_user(db, body.identifier)
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(401, "Invalid credentials.")
    if not user.is_active:
        raise HTTPException(403, "Account disabled.")
    if not user.is_verified:
        raise HTTPException(403, "Account not verified. Complete OTP verification first.")
    replaced = bool(user.active_device_id) and user.active_device_id != body.device_id
    tokens = await _issue_tokens(db, user, body.device_id)
    return {"tokens": tokens, "user": user_dict(user), "previous_device_signed_out": replaced}


@router.post("/token/refresh/")
async def refresh_token(refresh: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(refresh)
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired refresh token.")
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid token type.")
    user = (await db.execute(select(User).where(User.id == payload.get("user_id")))).scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found.")
    device_id = payload.get("device_id", "")
    return {
        "access": create_access_token(user.id, user.persona, device_id),
        "refresh": create_refresh_token(user.id, user.persona, device_id),
    }


@router.get("/me/")
async def me(user: User = Depends(get_current_user)):
    return {**user_dict(user), "pii_consent": user.pii_consent, "ai_consent": user.ai_consent}


class ConsentIn(BaseModel):
    pii_consent: bool | None = None
    ai_consent: bool | None = None


@router.post("/consent/")
async def set_consent(body: ConsentIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """NFR-004: record PII / AI-use consent (e.g. coach AI disclaimer)."""
    if body.pii_consent is not None:
        user.pii_consent = body.pii_consent
    if body.ai_consent is not None:
        user.ai_consent = body.ai_consent
    await audit(db, user.id, "consent", "user", user.id, f"pii={user.pii_consent} ai={user.ai_consent}")
    await db.commit()
    return {"pii_consent": user.pii_consent, "ai_consent": user.ai_consent}


@router.delete("/me/")
async def erase_me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """NFR-004 right-to-erasure: soft-delete now; purge after a 30-day window."""
    user.deleted_at = datetime.now(timezone.utc)
    user.is_active = False
    user.active_device_id = ""
    await audit(db, user.id, "erasure_request", "user", user.id, "soft-delete; 30-day purge")
    await db.commit()
    return {"message": "Account scheduled for deletion. Data will be purged after 30 days."}
