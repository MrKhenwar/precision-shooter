"""Device-bound JWT authentication.

Enforces the BFR rule "1 User ID = 1 Active Device": a token is only accepted
if the device_id embedded in it still matches the user's active_device_id.
A login from another device rebinds active_device_id, so older tokens stop
authenticating and the previous device is effectively signed out.
"""
from __future__ import annotations

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class DeviceBoundJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_device = validated_token.get('device_id')
        if token_device and user.active_device_id and token_device != user.active_device_id:
            raise AuthenticationFailed(
                'Session ended: your account was signed in on another device.',
                code='device_mismatch',
            )
        return user
