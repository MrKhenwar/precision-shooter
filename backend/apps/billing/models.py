"""Athlete subscription & billing logic (BFR §1.1).

Plan is derived from the trial window + coach linkage + AI opt-in:
  - Trial: free for the first 90 days from registration
  - Coached: ₹10/month once linked to a coach
  - AI: ₹50/month if independent and opted into AI coaching
  - Lapsed: trial over, no coach, no AI opt-in
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class Plan(models.TextChoices):
    TRIAL = 'trial', 'Free Trial'
    COACHED = 'coached', 'Coached (Rs 10/mo)'
    AI = 'ai', 'AI Coaching (Rs 50/mo)'
    LAPSED = 'lapsed', 'Lapsed'


PLAN_PRICE = {Plan.TRIAL: 0, Plan.COACHED: 10, Plan.AI: 50, Plan.LAPSED: 0}


class Subscription(models.Model):
    athlete = models.OneToOneField(
        'athletes.AthleteProfile', on_delete=models.CASCADE, related_name='subscription'
    )
    ai_opted = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.athlete} · {self.plan}'

    @property
    def trial_end_date(self):
        return self.athlete.registered_on + timezone.timedelta(days=settings.TRIAL_PERIOD_DAYS)

    @property
    def trial_days_left(self) -> int:
        delta = (self.trial_end_date - timezone.now()).days
        return max(delta, 0)

    @property
    def in_trial(self) -> bool:
        return timezone.now() <= self.trial_end_date

    @property
    def plan(self) -> str:
        if self.in_trial:
            return Plan.TRIAL
        if self.athlete.is_coached:
            return Plan.COACHED
        if self.ai_opted:
            return Plan.AI
        return Plan.LAPSED

    @property
    def price(self) -> int:
        return PLAN_PRICE[self.plan]

    @property
    def show_trial_nudge(self) -> bool:
        """BFR: nudge subscription selection near the end of the trial."""
        return self.in_trial and self.trial_days_left <= (
            settings.TRIAL_PERIOD_DAYS - settings.TRIAL_NUDGE_DAY
        )
