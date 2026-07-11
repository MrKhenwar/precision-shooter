"""Performance endpoints.

Athlete: own shooting records & diary (create/list), read own evaluations.
Coach:  author evaluations for a linked athlete; read a linked athlete's data.
"""
from __future__ import annotations

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Persona
from apps.athletes.models import AthleteProfile
from apps.coaching.models import CoachProfile

from .models import DiaryEntry, Evaluation, ShootingRecord
from .serializers import (
    DiaryEntrySerializer,
    EvaluationSerializer,
    ShootingRecordSerializer,
)


class IsAthlete(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.ATHLETE


class IsCoach(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.COACH


def _athlete(user) -> AthleteProfile:
    profile, _ = AthleteProfile.objects.get_or_create(user=user)
    return profile


def _coach(user) -> CoachProfile:
    profile, _ = CoachProfile.objects.get_or_create(user=user)
    return profile


def _linked_athlete_or_none(coach, athlete_id):
    return AthleteProfile.objects.filter(pk=athlete_id, coach=coach).first()


# --- Athlete: shooting records ----------------------------------------------

class MyShootingRecordsView(generics.ListCreateAPIView):
    serializer_class = ShootingRecordSerializer
    permission_classes = [IsAthlete]

    def get_queryset(self):
        return _athlete(self.request.user).shooting_records.all()

    def perform_create(self, serializer):
        serializer.save(athlete=_athlete(self.request.user))


# --- Athlete: diary (upsert per day) ----------------------------------------

class MyDiaryView(generics.ListCreateAPIView):
    serializer_class = DiaryEntrySerializer
    permission_classes = [IsAthlete]

    def get_queryset(self):
        return _athlete(self.request.user).diary_entries.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        athlete = _athlete(request.user)
        data = dict(serializer.validated_data)
        entry_date = data.pop('date', None) or timezone.localdate()
        entry, created = DiaryEntry.objects.update_or_create(
            athlete=athlete, date=entry_date, defaults=data
        )
        out = self.get_serializer(entry)
        return Response(out.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# --- Athlete: own evaluations (read) ----------------------------------------

class MyEvaluationsView(generics.ListAPIView):
    serializer_class = EvaluationSerializer
    permission_classes = [IsAthlete]

    def get_queryset(self):
        return _athlete(self.request.user).evaluations.all()


# --- Coach: create evaluation for a linked athlete --------------------------

class CreateEvaluationView(APIView):
    permission_classes = [IsCoach]

    def post(self, request):
        coach = _coach(request.user)
        athlete = _linked_athlete_or_none(coach, request.data.get('athlete_id'))
        if not athlete:
            return Response(
                {'detail': 'Athlete not linked to you.'}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EvaluationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evaluation = serializer.save(athlete=athlete, coach=coach)
        return Response(EvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED)


# --- Coach: read a linked athlete's data ------------------------------------

class _CoachAthleteListView(generics.ListAPIView):
    """Base: scope a queryset to a linked athlete, empty if not linked."""
    permission_classes = [IsCoach]
    related_name = None  # set in subclass

    def get_queryset(self):
        coach = _coach(self.request.user)
        athlete = _linked_athlete_or_none(coach, self.kwargs['athlete_id'])
        if not athlete:
            return self.serializer_class.Meta.model.objects.none()
        return getattr(athlete, self.related_name).all()


class AthleteEvaluationsView(_CoachAthleteListView):
    serializer_class = EvaluationSerializer
    related_name = 'evaluations'


class AthleteShootingRecordsView(_CoachAthleteListView):
    serializer_class = ShootingRecordSerializer
    related_name = 'shooting_records'


class AthleteDiaryView(_CoachAthleteListView):
    serializer_class = DiaryEntrySerializer
    related_name = 'diary_entries'
