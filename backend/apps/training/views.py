"""Training endpoints.

Coach: course plans (CRUD), assign training sessions to linked athletes.
Athlete: view assigned sessions (daily todo), mark complete.
"""
from __future__ import annotations

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Persona
from apps.athletes.models import AthleteProfile
from apps.coaching.models import CoachProfile

from .models import CoursePlan, TrainingSession
from .serializers import CoursePlanSerializer, TrainingSessionSerializer


class IsCoach(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.COACH


class IsAthlete(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.ATHLETE


def _coach(user) -> CoachProfile:
    return CoachProfile.objects.get_or_create(user=user)[0]


def _athlete(user) -> AthleteProfile:
    return AthleteProfile.objects.get_or_create(user=user)[0]


# --- Coach: course plans -----------------------------------------------------

class CoursePlanListCreateView(generics.ListCreateAPIView):
    serializer_class = CoursePlanSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return _coach(self.request.user).course_plans.all()

    def perform_create(self, serializer):
        serializer.save(coach=_coach(self.request.user))


class CoursePlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CoursePlanSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return _coach(self.request.user).course_plans.all()


# --- Coach: training sessions ------------------------------------------------

class TrainingSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = TrainingSessionSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        qs = _coach(self.request.user).training_sessions.select_related('athlete__user')
        athlete_id = self.request.query_params.get('athlete')
        if athlete_id:
            qs = qs.filter(athlete_id=athlete_id)
        return qs

    def create(self, request, *args, **kwargs):
        coach = _coach(request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        athlete = AthleteProfile.objects.filter(
            pk=serializer.validated_data['athlete'].id, coach=coach
        ).first()
        if not athlete:
            return Response(
                {'detail': 'Athlete not linked to you.'}, status=status.HTTP_404_NOT_FOUND
            )
        session = serializer.save(coach=coach)
        return Response(self.get_serializer(session).data, status=status.HTTP_201_CREATED)


# --- Athlete: my training (daily todo) --------------------------------------

class MyTrainingSessionsView(generics.ListAPIView):
    serializer_class = TrainingSessionSerializer
    permission_classes = [IsAthlete]

    def get_queryset(self):
        return _athlete(self.request.user).training_sessions.all()


class CompleteTrainingSessionView(APIView):
    permission_classes = [IsAthlete]

    def post(self, request, pk):
        session = TrainingSession.objects.filter(
            pk=pk, athlete=_athlete(request.user)
        ).first()
        if not session:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        done = bool(request.data.get('completed', True))
        session.mark_complete(done)
        return Response(TrainingSessionSerializer(session).data)
