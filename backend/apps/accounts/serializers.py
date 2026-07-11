"""Serializers for registration, OTP verification and login."""
from __future__ import annotations

import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import OTPCode, Persona

User = get_user_model()

# BFR password rule: min 8 chars, 1 upper, 1 lower, 1 number, 1 special.
PASSWORD_RE = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$'
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'mobile', 'first_name', 'last_name',
            'persona', 'expert_type', 'password',
        ]

    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('mobile'):
            raise serializers.ValidationError(
                'Provide an email or a mobile number to register.'
            )
        if attrs.get('persona') == Persona.EXPERT and not attrs.get('expert_type'):
            raise serializers.ValidationError(
                {'expert_type': 'Required for the External Expert persona.'}
            )
        return attrs

    def validate_password(self, value):
        if not PASSWORD_RE.match(value):
            raise serializers.ValidationError(
                'Password must be 8+ chars with upper, lower, number and special character.'
            )
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField()
    code = serializers.CharField(max_length=6)


class ResendOTPSerializer(serializers.Serializer):
    identifier = serializers.CharField()


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(help_text='Email or mobile number')
    password = serializers.CharField(write_only=True)
    device_id = serializers.CharField()
    recaptcha_token = serializers.CharField(required=False, allow_blank=True)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'mobile', 'first_name', 'last_name', 'full_name',
            'persona', 'expert_type', 'is_verified', 'date_joined',
        ]
        read_only_fields = ['is_verified', 'date_joined']
