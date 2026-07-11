"""Password hashing (Django-PBKDF2 compatible) and JWT tokens.

The PBKDF2 scheme matches Django's default hasher so existing user password
hashes migrated from the old SQLite DB keep verifying — no password resets.
"""
from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import settings

_ALGO = "pbkdf2_sha256"
_DEFAULT_ITERATIONS = 600_000


def hash_password(password: str, iterations: int = _DEFAULT_ITERATIONS) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), iterations)
    b64 = base64.b64encode(dk).decode().strip()
    return f"{_ALGO}${iterations}${salt}${b64}"


def verify_password(password: str, encoded: str) -> bool:
    if not encoded:
        return False
    try:
        algorithm, iterations, salt, digest = encoded.split("$", 3)
    except ValueError:
        return False
    if algorithm != _ALGO:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations))
    computed = base64.b64encode(dk).decode().strip()
    return secrets.compare_digest(computed, digest)


def _token(payload: dict, minutes: int | None = None, days: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    exp = now + (timedelta(minutes=minutes) if minutes else timedelta(days=days))
    return jwt.encode({**payload, "iat": now, "exp": exp}, settings.SECRET_KEY, algorithm="HS256")


def create_access_token(user_id: int, persona: str, device_id: str) -> str:
    return _token(
        {"user_id": user_id, "persona": persona, "device_id": device_id, "type": "access"},
        minutes=settings.ACCESS_TOKEN_MINUTES,
    )


def create_refresh_token(user_id: int, persona: str, device_id: str) -> str:
    return _token(
        {"user_id": user_id, "persona": persona, "device_id": device_id, "type": "refresh"},
        days=settings.REFRESH_TOKEN_DAYS,
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
