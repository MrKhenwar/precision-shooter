"""Performance diagnostics & records (BFR §4.3).

  - Evaluation: Initial/Periodic, three pillars (Shooting, S&C, Overall)
  - ShootingRecord: daily log (shots, inner-tens, grouping)
  - DiaryEntry: daily training diary (sleep, resting HR, stress)
"""
from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

SCORE = [MinValueValidator(0), MaxValueValidator(10)]


class EvaluationKind(models.TextChoices):
    INITIAL = 'initial', 'Initial Evaluation'
    PERIODIC = 'periodic', 'Periodic Evaluation'


class Evaluation(models.Model):
    """Coach-authored diagnostic across the three BFR pillars (scores 0-10)."""

    athlete = models.ForeignKey(
        'athletes.AthleteProfile', on_delete=models.CASCADE, related_name='evaluations'
    )
    coach = models.ForeignKey(
        'coaching.CoachProfile', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='evaluations'
    )
    kind = models.CharField(max_length=10, choices=EvaluationKind.choices)
    date = models.DateField(default=timezone.localdate)

    # Shooting pillar
    hold_stability = models.PositiveSmallIntegerField(default=0, validators=SCORE)
    trigger_timing = models.PositiveSmallIntegerField(default=0, validators=SCORE)
    approach = models.PositiveSmallIntegerField(default=0, validators=SCORE)
    follow_through = models.PositiveSmallIntegerField(default=0, validators=SCORE)

    # S&C pillar
    core_strength = models.PositiveSmallIntegerField(default=0, validators=SCORE)
    cardio_endurance = models.PositiveSmallIntegerField(default=0, validators=SCORE)
    balance_index = models.PositiveSmallIntegerField(default=0, validators=SCORE)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'{self.kind} · {self.athlete} · {self.date}'

    @property
    def shooting_score(self) -> float:
        vals = [self.hold_stability, self.trigger_timing, self.approach, self.follow_through]
        return round(sum(vals) / len(vals), 1)

    @property
    def sc_score(self) -> float:
        vals = [self.core_strength, self.cardio_endurance, self.balance_index]
        return round(sum(vals) / len(vals), 1)

    @property
    def overall_score(self) -> float:
        return round((self.shooting_score + self.sc_score) / 2, 1)


class ShootingRecord(models.Model):
    """Daily shooting log (BFR §4.3 Shooting Daily Record)."""

    athlete = models.ForeignKey(
        'athletes.AthleteProfile', on_delete=models.CASCADE, related_name='shooting_records'
    )
    date = models.DateField(default=timezone.localdate)
    total_shots = models.PositiveSmallIntegerField(default=0)
    inner_tens = models.PositiveSmallIntegerField(default=0, help_text='10.3+ shots')
    grouping_mm = models.FloatField(null=True, blank=True, help_text='Group size (mm)')
    total_score = models.FloatField(null=True, blank=True)
    target_file = models.FileField(
        upload_to='shooting/targets/', null=True, blank=True,
        help_text='SCATT / Meyton export',
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-date']
        indexes = [models.Index(fields=['athlete', 'date'])]

    def __str__(self):
        return f'{self.athlete} · {self.date} · {self.total_shots} shots'

    @property
    def inner_ten_pct(self) -> int:
        return round(100 * self.inner_tens / self.total_shots) if self.total_shots else 0


class DiaryEntry(models.Model):
    """Daily training diary (BFR §4.3 Daily Diary Record)."""

    athlete = models.ForeignKey(
        'athletes.AthleteProfile', on_delete=models.CASCADE, related_name='diary_entries'
    )
    date = models.DateField(default=timezone.localdate)
    sleep_quality = models.PositiveSmallIntegerField(default=0, validators=SCORE)
    resting_hr = models.PositiveSmallIntegerField(null=True, blank=True, help_text='bpm')
    stress_level = models.PositiveSmallIntegerField(default=0, validators=SCORE)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(fields=['athlete', 'date'], name='unique_diary_per_day')
        ]

    def __str__(self):
        return f'Diary · {self.athlete} · {self.date}'
