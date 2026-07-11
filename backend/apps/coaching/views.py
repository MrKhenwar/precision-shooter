"""Coach-side endpoints: profile, pending link requests, approve/reject, roster, tier."""
from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Persona
from apps.athletes.models import AthleteProfile, CoachAthleteLink, TIER_ORDER
from apps.athletes.serializers import CoachAthleteLinkSerializer

from .models import AttendanceRecord, AttendanceStatus, Batch, CoachProfile, ExpertProfile
from .serializers import (
    AttendanceRecordSerializer,
    BatchMemberSerializer,
    BatchSerializer,
    CoachProfileSerializer,
    ExpertProfileSerializer,
    MarkAttendanceSerializer,
    RosterAthleteSerializer,
)


class IsCoach(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.COACH


class IsExpert(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.EXPERT


def _coach_profile(user) -> CoachProfile:
    profile, _ = CoachProfile.objects.get_or_create(user=user)
    return profile


class MyCoachProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CoachProfileSerializer
    permission_classes = [IsCoach]

    def get_object(self):
        return _coach_profile(self.request.user)


class PendingLinkRequestsView(generics.ListAPIView):
    """Incoming athlete connection requests awaiting this coach's approval."""
    serializer_class = CoachAthleteLinkSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        coach = _coach_profile(self.request.user)
        return CoachAthleteLink.objects.filter(coach=coach, status='pending')


class RespondLinkRequestView(APIView):
    """Approve or reject a pending link request."""
    permission_classes = [IsCoach]

    def post(self, request, pk, action):
        coach = _coach_profile(request.user)
        link = CoachAthleteLink.objects.filter(
            pk=pk, coach=coach, status='pending'
        ).first()
        if not link:
            return Response(
                {'detail': 'Pending request not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        if action == 'approve':
            link.approve()
            msg = 'Link approved. Athlete is now connected.'
        elif action == 'reject':
            link.reject()
            msg = 'Request rejected.'
        else:
            return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': msg, 'link': CoachAthleteLinkSerializer(link).data})


class RosterView(generics.ListAPIView):
    """All athletes linked to this coach."""
    serializer_class = RosterAthleteSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        coach = _coach_profile(self.request.user)
        return AthleteProfile.objects.filter(coach=coach).select_related('user')


class SetAthleteTierView(APIView):
    """Coach updates a linked athlete's tier (athlete cannot self-edit this)."""
    permission_classes = [IsCoach]

    def post(self, request, athlete_id):
        coach = _coach_profile(request.user)
        athlete = AthleteProfile.objects.filter(pk=athlete_id, coach=coach).first()
        if not athlete:
            return Response(
                {'detail': 'Athlete not linked to you.'}, status=status.HTTP_404_NOT_FOUND
            )
        tier = request.data.get('tier')
        if tier not in TIER_ORDER:
            return Response(
                {'detail': f'Invalid tier. Allowed: {", ".join(TIER_ORDER)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        athlete.set_tier(tier)
        return Response({'message': 'Tier updated.', 'current_tier': athlete.current_tier})


# --- Batch management (BFR §4.2) ---------------------------------------------

class BatchListCreateView(generics.ListCreateAPIView):
    serializer_class = BatchSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return _coach_profile(self.request.user).batches.all()

    def perform_create(self, serializer):
        serializer.save(coach=_coach_profile(self.request.user))


class BatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BatchSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return _coach_profile(self.request.user).batches.all()


class BatchMembersView(APIView):
    """List, add or remove athletes in a batch (capacity-enforced)."""
    permission_classes = [IsCoach]

    def _get_batch(self, request, batch_id):
        return Batch.objects.filter(pk=batch_id, coach=_coach_profile(request.user)).first()

    def get(self, request, batch_id):
        batch = self._get_batch(request, batch_id)
        if not batch:
            return Response({'detail': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(BatchMemberSerializer(batch.athletes.select_related('user'), many=True).data)

    def post(self, request, batch_id):
        batch = self._get_batch(request, batch_id)
        if not batch:
            return Response({'detail': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        if batch.is_full:
            return Response(
                {'detail': 'Batch is at full capacity.'}, status=status.HTTP_400_BAD_REQUEST
            )
        coach = _coach_profile(request.user)
        athlete = AthleteProfile.objects.filter(
            pk=request.data.get('athlete_id'), coach=coach
        ).first()
        if not athlete:
            return Response(
                {'detail': 'Athlete not linked to you.'}, status=status.HTTP_404_NOT_FOUND
            )
        batch.athletes.add(athlete)
        return Response(
            {'message': 'Athlete added to batch.', 'member_count': batch.member_count},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, batch_id, athlete_id):
        batch = self._get_batch(request, batch_id)
        if not batch:
            return Response({'detail': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        batch.athletes.remove(athlete_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Attendance (BFR §4.1) ---------------------------------------------------

class BatchAttendanceView(APIView):
    """GET a batch's attendance for a date; POST to bulk-mark it (coach checklist)."""
    permission_classes = [IsCoach]

    def _get_batch(self, request, batch_id):
        return Batch.objects.filter(pk=batch_id, coach=_coach_profile(request.user)).first()

    def get(self, request, batch_id):
        batch = self._get_batch(request, batch_id)
        if not batch:
            return Response({'detail': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        date = request.query_params.get('date') or timezone.localdate().isoformat()
        records = batch.attendance.filter(date=date).select_related('athlete__user')
        return Response({
            'date': date,
            'records': AttendanceRecordSerializer(records, many=True).data,
        })

    def post(self, request, batch_id):
        batch = self._get_batch(request, batch_id)
        if not batch:
            return Response({'detail': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MarkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        date = serializer.validated_data.get('date') or timezone.localdate()
        member_ids = set(batch.athletes.values_list('id', flat=True))

        saved = 0
        for entry in serializer.validated_data['entries']:
            athlete_id = entry.get('athlete_id')
            if athlete_id not in member_ids:
                continue  # ignore non-members
            status_val = entry.get('status', AttendanceStatus.PRESENT)
            if status_val not in AttendanceStatus.values:
                continue
            AttendanceRecord.objects.update_or_create(
                athlete_id=athlete_id, batch=batch, date=date,
                defaults={'status': status_val, 'source': 'coach'},
            )
            saved += 1
        return Response({'message': f'Attendance saved for {saved} athletes.', 'date': str(date)})


class AttendanceSummaryView(APIView):
    """Aggregated present/absent counts over today / week / month (BFR time views)."""
    permission_classes = [IsCoach]

    def get(self, request):
        coach = _coach_profile(request.user)
        period = request.query_params.get('period', 'week')
        today = timezone.localdate()
        start = {
            'today': today,
            'week': today - timedelta(days=6),
            'month': today - timedelta(days=29),
        }.get(period, today - timedelta(days=6))

        qs = AttendanceRecord.objects.filter(batch__coach=coach, date__gte=start, date__lte=today)
        agg = qs.aggregate(
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
            excused=Count('id', filter=Q(status='excused')),
            total=Count('id'),
        )
        present_like = (agg['present'] or 0) + (agg['late'] or 0)
        agg['attendance_pct'] = round(100 * present_like / agg['total']) if agg['total'] else 0
        agg['period'] = period
        agg['from'] = start.isoformat()
        agg['to'] = today.isoformat()
        return Response(agg)


class AttendanceRecordsView(APIView):
    """All attendance records across the coach's batches, optionally within a
    date range — used by the attendance calendar (per-day athlete list)."""
    permission_classes = [IsCoach]

    def get(self, request):
        coach = _coach_profile(request.user)
        qs = AttendanceRecord.objects.filter(batch__coach=coach).select_related('athlete__user', 'batch')
        frm = request.query_params.get('from')
        to = request.query_params.get('to')
        if frm:
            qs = qs.filter(date__gte=frm)
        if to:
            qs = qs.filter(date__lte=to)
        data = [
            {
                'id': r.id,
                'athlete': r.athlete_id,
                'athlete_name': r.athlete.user.full_name,
                'batch': r.batch_id,
                'batch_name': r.batch.name,
                'date': r.date.isoformat(),
                'status': r.status,
            }
            for r in qs.order_by('date')
        ]
        return Response(data)


class AthleteAttendanceView(APIView):
    """Athlete-wise drilldown: history + attendance percentage (BFR §4.1)."""
    permission_classes = [IsCoach]

    def get(self, request, athlete_id):
        coach = _coach_profile(request.user)
        athlete = AthleteProfile.objects.filter(pk=athlete_id, coach=coach).first()
        if not athlete:
            return Response({'detail': 'Athlete not linked to you.'}, status=status.HTTP_404_NOT_FOUND)
        records = athlete.attendance.all()[:60]
        total = athlete.attendance.count()
        present_like = athlete.attendance.filter(status__in=['present', 'late']).count()
        pct = round(100 * present_like / total) if total else 0
        return Response({
            'athlete_id': athlete.id,
            'attendance_pct': pct,
            'total_sessions': total,
            'records': AttendanceRecordSerializer(records, many=True).data,
        })


# --- Expert persona (BFR §1.4) ----------------------------------------------

class MyExpertProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ExpertProfileSerializer
    permission_classes = [IsExpert]

    def get_object(self):
        profile, _ = ExpertProfile.objects.get_or_create(user=self.request.user)
        return profile


class ExpertDirectoryView(generics.ListAPIView):
    """Expert profiles are viewable by any authenticated user (marketplace)."""
    serializer_class = ExpertProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExpertProfile.objects.select_related('user').all()
