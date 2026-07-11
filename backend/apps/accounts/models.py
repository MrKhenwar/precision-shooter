"""User & authentication models for Precision Shooter.

Implements the persona model and security rules from the BFR:
  - 4 personas (Athlete, Coach, Parent, External Expert)
  - Login by email OR mobile
  - 1 User = 1 active device (device binding)
  - OTP verification (120s expiry, max 3 resends/hour)
"""
from __future__ import annotations

import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Persona(models.TextChoices):
    ATHLETE = 'athlete', 'Athlete'
    COACH = 'coach', 'Personal Coach'
    PARENT = 'parent', 'Parent'
    EXPERT = 'expert', 'External Expert'


class ExpertType(models.TextChoices):
    SC_COACH = 'sc_coach', 'S&C Coach'
    PHYSIO = 'physio', 'Physiotherapist'
    PSYCHOLOGIST = 'psychologist', 'Psychologist'
    CONSULTANT = 'consultant', 'External Consultant Coach'
    YOGA = 'yoga', 'Yoga Expert'
    DIETICIAN = 'dietician', 'Dietician'


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, mobile, password, **extra):
        if not email and not mobile:
            raise ValueError('Either email or mobile must be provided.')
        email = self.normalize_email(email) if email else None
        user = self.model(email=email, mobile=mobile, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email=None, mobile=None, password=None, **extra):
        extra.setdefault('is_staff', False)
        extra.setdefault('is_superuser', False)
        return self._create_user(email, mobile, password, **extra)

    def create_superuser(self, email=None, mobile=None, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('persona', Persona.COACH)
        if extra['is_staff'] is not True or extra['is_superuser'] is not True:
            raise ValueError('Superuser must have is_staff=True and is_superuser=True.')
        return self._create_user(email, mobile, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """Persona-based account. Login identifier is email or mobile."""

    email = models.EmailField('email address', unique=True, null=True, blank=True)
    mobile = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)

    persona = models.CharField(max_length=20, choices=Persona.choices)
    expert_type = models.CharField(
        max_length=20, choices=ExpertType.choices, blank=True,
        help_text='Only relevant when persona == expert.',
    )

    # 1 User = 1 active device. A login from a new device replaces this,
    # invalidating sessions bound to the previous device.
    active_device_id = models.CharField(max_length=255, blank=True)

    is_verified = models.BooleanField(default=False)  # OTP-verified
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.identifier} ({self.persona})'

    @property
    def identifier(self) -> str:
        return self.email or self.mobile or f'user#{self.pk}'

    @property
    def full_name(self) -> str:
        return f'{self.first_name} {self.last_name}'.strip()


class OTPCode(models.Model):
    """One-time passcode for registration/login verification.

    BFR: expiry 120s, max 3 resends/hour.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'created_at'])]

    @classmethod
    def issue(cls, user: User) -> 'OTPCode':
        code = f'{secrets.randbelow(1_000_000):06d}'
        return cls.objects.create(user=user, code=code)

    @property
    def is_expired(self) -> bool:
        expiry = timedelta(seconds=settings.OTP_EXPIRY_SECONDS)
        return timezone.now() > self.created_at + expiry

    @property
    def is_consumed(self) -> bool:
        return self.consumed_at is not None

    @classmethod
    def resends_in_last_hour(cls, user: User) -> int:
        since = timezone.now() - timedelta(hours=1)
        return cls.objects.filter(user=user, created_at__gte=since).count()
