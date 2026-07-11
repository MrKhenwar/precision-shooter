"""Auth endpoints: register, OTP verify/resend, login (with device binding), me."""
from __future__ import annotations

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPCode
from .serializers import (
    LoginSerializer,
    OTPVerifySerializer,
    RegisterSerializer,
    ResendOTPSerializer,
    UserSerializer,
)
from .utils import find_user_by_identifier, verify_recaptcha


def _issue_tokens(user, device_id: str) -> dict:
    """Bind the device and mint a JWT pair carrying the device id.

    The access token embeds device_id so a request from a stale device can be
    rejected (see DeviceBoundJWTAuthentication).
    """
    user.active_device_id = device_id
    user.save(update_fields=['active_device_id'])
    refresh = RefreshToken.for_user(user)
    refresh['device_id'] = device_id
    refresh['persona'] = user.persona
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        otp = OTPCode.issue(user)
        # TODO: dispatch OTP via SMS/email provider. Returned here for dev only.
        payload = {
            'user': UserSerializer(user).data,
            'message': 'Registered. Verify the OTP sent to your email/mobile.',
        }
        if settings.DEBUG:
            payload['debug_otp'] = otp.code
        return Response(payload, status=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = find_user_by_identifier(serializer.validated_data['identifier'])
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        otp = user.otp_codes.filter(consumed_at__isnull=True).first()
        if not otp or otp.is_expired:
            return Response(
                {'detail': 'OTP expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if otp.code != serializer.validated_data['code']:
            return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        otp.consumed_at = timezone.now()
        otp.save(update_fields=['consumed_at'])
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        return Response({'message': 'Account verified. You can now log in.'})


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = find_user_by_identifier(serializer.validated_data['identifier'])
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if OTPCode.resends_in_last_hour(user) >= settings.OTP_MAX_RESENDS_PER_HOUR:
            return Response(
                {'detail': 'Too many OTP requests. Try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        otp = OTPCode.issue(user)
        payload = {'message': 'A new OTP has been sent.'}
        if settings.DEBUG:
            payload['debug_otp'] = otp.code
        return Response(payload)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if not verify_recaptcha(data.get('recaptcha_token', '')):
            return Response(
                {'detail': 'reCAPTCHA verification failed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = find_user_by_identifier(data['identifier'])
        if not user or not user.check_password(data['password']):
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response({'detail': 'Account disabled.'}, status=status.HTTP_403_FORBIDDEN)
        if not user.is_verified:
            return Response(
                {'detail': 'Account not verified. Complete OTP verification first.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Device binding: logging in here makes this the only active device.
        replaced = bool(user.active_device_id) and user.active_device_id != data['device_id']
        tokens = _issue_tokens(user, data['device_id'])
        return Response({
            'tokens': tokens,
            'user': UserSerializer(user).data,
            'previous_device_signed_out': replaced,
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
