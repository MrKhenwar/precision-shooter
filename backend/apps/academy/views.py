"""Fees & Inventory endpoints.

Coach: manage fee records and inventory; cylinder expiry alerts.
Athlete: view own fee records.
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

from .models import FeeRecord, InventoryItem
from .serializers import FeeRecordSerializer, InventoryItemSerializer


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


# --- Fees --------------------------------------------------------------------

class FeeListCreateView(generics.ListCreateAPIView):
    serializer_class = FeeRecordSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        qs = _coach(self.request.user).fee_records.select_related('athlete__user')
        st = self.request.query_params.get('status')
        return qs.filter(status=st) if st else qs

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
        fee = serializer.save(coach=coach)
        return Response(self.get_serializer(fee).data, status=status.HTTP_201_CREATED)


class FeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeRecordSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return _coach(self.request.user).fee_records.all()


class MyFeesView(generics.ListAPIView):
    serializer_class = FeeRecordSerializer
    permission_classes = [IsAthlete]

    def get_queryset(self):
        return _athlete(self.request.user).fee_records.all()


class PayFeeView(APIView):
    """Athlete pays one of their own fees (simulated — marks it paid)."""
    permission_classes = [IsAthlete]

    def post(self, request, pk):
        athlete = _athlete(request.user)
        fee = athlete.fee_records.filter(pk=pk).first()
        if not fee:
            return Response({'detail': 'Fee not found.'}, status=status.HTTP_404_NOT_FOUND)
        if fee.status == 'paid':
            return Response({'detail': 'This fee is already paid.'}, status=status.HTTP_400_BAD_REQUEST)
        fee.status = 'paid'
        fee.paid_on = timezone.localdate()
        fee.save(update_fields=['status', 'paid_on'])
        return Response(FeeRecordSerializer(fee).data)


# --- Inventory ---------------------------------------------------------------

class InventoryListCreateView(generics.ListCreateAPIView):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        qs = _coach(self.request.user).inventory.select_related('assigned_to__user')
        cat = self.request.query_params.get('category')
        return qs.filter(category=cat) if cat else qs

    def perform_create(self, serializer):
        serializer.save(coach=_coach(self.request.user))


class InventoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return _coach(self.request.user).inventory.all()


class ExpiringCylindersView(generics.ListAPIView):
    """Cylinders within the 90-day expiry warning window (BFR alert)."""
    serializer_class = InventoryItemSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        cylinders = _coach(self.request.user).inventory.filter(
            category='cylinder', cylinder_expiry__isnull=False
        )
        return [c for c in cylinders if c.expiry_alert]
