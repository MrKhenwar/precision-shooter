"""Helper utilities for auth: identifier lookup and reCAPTCHA verification."""
from __future__ import annotations

import urllib.parse
import urllib.request

from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


def find_user_by_identifier(identifier: str):
    """Resolve a login identifier (email or mobile) to a User, or None."""
    identifier = (identifier or '').strip()
    if not identifier:
        return None
    if '@' in identifier:
        return User.objects.filter(email__iexact=identifier).first()
    return User.objects.filter(mobile=identifier).first()


def verify_recaptcha(token: str) -> bool:
    """Verify a Google reCAPTCHA v3 token.

    Skipped (returns True) in DEBUG or when no secret key is configured,
    so local development doesn't require a live reCAPTCHA setup.
    """
    secret = settings.RECAPTCHA_SECRET_KEY
    if settings.DEBUG or not secret:
        return True
    try:
        data = urllib.parse.urlencode({'secret': secret, 'response': token}).encode()
        with urllib.request.urlopen(
            'https://www.google.com/recaptcha/api/siteverify', data=data, timeout=5
        ) as resp:
            import json
            result = json.loads(resp.read().decode())
        return bool(result.get('success')) and result.get('score', 0) >= 0.5
    except Exception:
        return False
