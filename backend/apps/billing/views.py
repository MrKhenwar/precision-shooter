"""Subscription endpoints for the athlete persona."""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Persona
from apps.athletes.models import AthleteProfile

from .models import PLAN_PRICE, Plan, Subscription


class IsAthlete(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.ATHLETE


def _subscription(user) -> Subscription:
    athlete, _ = AthleteProfile.objects.get_or_create(user=user)
    sub, _ = Subscription.objects.get_or_create(athlete=athlete)
    return sub


def _serialize(sub: Subscription) -> dict:
    return {
        'plan': sub.plan,
        'plan_label': Plan(sub.plan).label,
        'price': sub.price,
        'in_trial': sub.in_trial,
        'trial_days_left': sub.trial_days_left,
        'trial_end_date': sub.trial_end_date.date().isoformat(),
        'is_coached': sub.athlete.is_coached,
        'ai_opted': sub.ai_opted,
        'show_trial_nudge': sub.show_trial_nudge,
        'options': [
            {'plan': Plan.COACHED, 'price': PLAN_PRICE[Plan.COACHED],
             'available': sub.athlete.is_coached,
             'note': 'Link with a coach to unlock'},
            {'plan': Plan.AI, 'price': PLAN_PRICE[Plan.AI], 'available': True,
             'note': 'Independent AI-guided training'},
        ],
    }


class MySubscriptionView(APIView):
    permission_classes = [IsAthlete]

    def get(self, request):
        return Response(_serialize(_subscription(request.user)))


class ChooseAIView(APIView):
    permission_classes = [IsAthlete]

    def post(self, request):
        sub = _subscription(request.user)
        sub.ai_opted = bool(request.data.get('ai_opted', True))
        sub.save(update_fields=['ai_opted', 'updated_at'])
        return Response(_serialize(sub))
