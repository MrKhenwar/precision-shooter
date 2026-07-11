"""Coach, Parent and Expert profiles (persona extensions of User).

Also holds the Batch and Attendance models (BFR §4.1 Attendance Engine,
§4.2 Batch & Team Management) since the Coach owns these.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class CoachProfile(models.Model):
    """Extra data for the Personal Coach persona.

    BFR registration matrix: coaching credentials (license, experience).
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coach_profile'
    )
    license_type = models.CharField(
        max_length=50, blank=True,
        help_text='e.g., ISSF A/B/C, National License',
    )
    license_number = models.CharField(max_length=100, blank=True)
    license_document = models.FileField(upload_to='credentials/coach/', null=True, blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f'Coach: {self.user.full_name or self.user.identifier}'

    @property
    def active_athlete_count(self) -> int:
        return self.athlete_links.filter(status=AthleteLinkStatus.APPROVED).count()


class ParentProfile(models.Model):
    """Parent persona. Read-only access to a linked athlete's dashboard."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='parent_profile'
    )
    # Linked athlete set on the AthleteProfile side via parent FK.

    def __str__(self):
        return f'Parent: {self.user.full_name or self.user.identifier}'


class ExpertProfile(models.Model):
    """External Expert persona (S&C, physio, psychologist, etc.)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expert_profile'
    )
    degree = models.CharField(max_length=120, blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    service_history = models.TextField(blank=True, help_text='Institute / services experience')
    bio = models.TextField(blank=True)
    credential_document = models.FileField(upload_to='credentials/expert/', null=True, blank=True)

    def __str__(self):
        return f'Expert ({self.user.expert_type}): {self.user.full_name or self.user.identifier}'


class Weekday(models.TextChoices):
    MON = 'mon', 'Monday'
    TUE = 'tue', 'Tuesday'
    WED = 'wed', 'Wednesday'
    THU = 'thu', 'Thursday'
    FRI = 'fri', 'Friday'
    SAT = 'sat', 'Saturday'
    SUN = 'sun', 'Sunday'


class Batch(models.Model):
    """A training group with capacity, scheduled days and a time slot (BFR §4.2)."""

    coach = models.ForeignKey(
        CoachProfile, on_delete=models.CASCADE, related_name='batches'
    )
    name = models.CharField(max_length=80)
    capacity = models.PositiveSmallIntegerField(default=20)
    # Comma-separated weekday codes, e.g. "mon,wed,fri".
    days = models.CharField(max_length=40, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    athletes = models.ManyToManyField(
        'athletes.AthleteProfile', related_name='batches', blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['name']
        unique_together = ('coach', 'name')

    def __str__(self):
        return f'{self.name} ({self.coach})'

    @property
    def member_count(self) -> int:
        return self.athletes.count()

    @property
    def is_full(self) -> bool:
        return self.member_count >= self.capacity

    @property
    def day_list(self) -> list[str]:
        return [d for d in self.days.split(',') if d]


class AttendanceStatus(models.TextChoices):
    PRESENT = 'present', 'Present'
    ABSENT = 'absent', 'Absent'
    LATE = 'late', 'Late'
    EXCUSED = 'excused', 'Excused'


class AttendanceSource(models.TextChoices):
    COACH = 'coach', 'Marked by Coach'
    SELF_QR = 'self_qr', 'Self (QR)'
    SELF_GEO = 'self_geo', 'Self (Geofence)'
    SELF = 'self', 'Self'


class AttendanceRecord(models.Model):
    """A single athlete's attendance for a date (BFR §4.1 dual-entry).

    Can be marked by the coach (checklist) or self-checked by the athlete
    (QR / geofence). One record per athlete per batch per day.
    """

    athlete = models.ForeignKey(
        'athletes.AthleteProfile', on_delete=models.CASCADE, related_name='attendance'
    )
    batch = models.ForeignKey(
        Batch, on_delete=models.CASCADE, related_name='attendance', null=True, blank=True
    )
    date = models.DateField(default=timezone.localdate)
    status = models.CharField(
        max_length=10, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT
    )
    source = models.CharField(
        max_length=10, choices=AttendanceSource.choices, default=AttendanceSource.COACH
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(
                fields=['athlete', 'batch', 'date'], name='unique_attendance_per_day'
            )
        ]
        indexes = [models.Index(fields=['date']), models.Index(fields=['athlete', 'date'])]

    def __str__(self):
        return f'{self.athlete} {self.date} {self.status}'


# Imported at bottom to avoid circular import at module load.
from apps.athletes.models import AthleteLinkStatus  # noqa: E402
