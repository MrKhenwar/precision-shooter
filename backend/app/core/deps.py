"""Auth dependencies: current user (device-bound JWT) + persona guards."""
from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .security import decode_token
from ..models import User

bearer = HTTPBearer(auto_error=False)


class DeviceMismatch(Exception):
    """Raised when a token's device no longer matches the active device."""


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required.")
    try:
        payload = decode_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token.")

    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type.")

    user = (await db.execute(select(User).where(User.id == payload.get("user_id")))).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found.")

    token_device = payload.get("device_id")
    if token_device and user.active_device_id and token_device != user.active_device_id:
        raise DeviceMismatch()
    return user


def require_persona(*personas: str):
    async def guard(user: User = Depends(get_current_user)) -> User:
        if user.persona not in personas:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not permitted for your persona.")
        return user
    return guard


require_athlete = require_persona("athlete")
require_coach = require_persona("coach")
require_parent = require_persona("parent")
require_expert = require_persona("expert")
