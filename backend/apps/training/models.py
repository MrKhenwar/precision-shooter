"""Course & training plan management (BFR §4.4).

  - CoursePlan: macro/meso cycle with quarterly goals & themes
  - TrainingSession: micro-level daily plan assigned to an athlete; syncs to
    the athlete's daily todo view and can be marked complete by the athlete.
"""
from __future__ import annotations

from django.db import models
from django.utils import timezone


class CycleType(models.TextChoices):
    MACRO = 'macro', 'Macrocycle'
    MESO = 'meso', 'Mesocycle'


class CoursePlan(models.Model):
    coach = models.ForeignKey(
        'coaching.CoachProfile', on_delete=models.CASCADE, related_name='course_plans'
    )
    title = models.CharField(max_length=120)
    cycle = models.CharField(max_length=10, choices=CycleType.choices, default=CycleType.MESO)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    themes = models.TextField(blank=True, help_text='Technical themes, competition peaks, goals')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.cycle})'


class TrainingSession(models.Model):
    """A daily training plan assigned to a single athlete."""

    coach = models.ForeignKey(
        'coaching.CoachProfile', on_delete=models.CASCADE, related_name='training_sessions'
    )
    athlete = models.ForeignKey(
        'athletes.AthleteProfile', on_delete=models.CASCADE, related_name='training_sessions'
    )
    course_plan = models.ForeignKey(
        CoursePlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions'
    )
    date = models.DateField(default=timezone.localdate)
    title = models.CharField(max_length=120)
    drills = models.TextField(blank=True, help_text='Holding drills, dry firing, match sim, etc.')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-date']
        indexes = [models.Index(fields=['athlete', 'date'])]

    def __str__(self):
        return f'{self.title} · {self.athlete} · {self.date}'

    def mark_complete(self, done: bool = True) -> None:
        self.completed = done
        self.completed_at = timezone.now() if done else None
        self.save(update_fields=['completed', 'completed_at'])
