"""Athlete-side endpoints: own profile, master data, coach link requests."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Persona
from apps.coaching.models import (
    AttendanceRecord,
    AttendanceStatus,
    Batch,
    CoachProfile,
    ParentProfile,
)
from apps.coaching.serializers import AttendanceRecordSerializer

from .models import AthleteProfile, Club, CoachAthleteLink, ParentChildLink
from .serializers import (
    AthleteProfileSerializer,
    ClubSerializer,
    CoachAthleteLinkSerializer,
    LinkRequestSerializer,
)

User = get_user_model()


class IsParent(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.PARENT


def _parent_profile(user) -> ParentProfile:
    profile, _ = ParentProfile.objects.get_or_create(user=user)
    return profile


def _athlete_profile(user) -> AthleteProfile:
    """Get or lazily create the AthleteProfile for an athlete user."""
    profile, _ = AthleteProfile.objects.get_or_create(user=user)
    return profile


class IsAthlete(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.persona == Persona.ATHLETE


class MyAthleteProfileView(generics.RetrieveUpdateAPIView):
    """GET / PATCH the logged-in athlete's own profile."""
    serializer_class = AthleteProfileSerializer
    permission_classes = [IsAthlete]

    def get_object(self):
        return _athlete_profile(self.request.user)


class ClubListView(generics.ListAPIView):
    """Master list of clubs/states for the registration dropdown."""
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticated]


class RequestCoachLinkView(APIView):
    """Athlete submits a coach mobile number -> creates a pending link request."""
    permission_classes = [IsAthlete]

    def post(self, request):
        serializer = LinkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coach_mobile = serializer.validated_data['coach_mobile'].strip()

        coach_user = User.objects.filter(
            mobile=coach_mobile, persona=Persona.COACH
        ).first()
        if not coach_user:
            return Response(
                {'detail': 'Coach not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        coach_profile, _ = CoachProfile.objects.get_or_create(user=coach_user)
        athlete = _athlete_profile(request.user)

        link, created = CoachAthleteLink.objects.get_or_create(
            athlete=athlete, coach=coach_profile, status='pending'
        )
        # TODO: push notification to the coach's app.
        return Response(
            {
                'message': 'Request sent. Awaiting coach approval.',
                'link': CoachAthleteLinkSerializer(link).data,
                'already_pending': not created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MyLinkRequestsView(generics.ListAPIView):
    """Athlete views the status of their own link requests."""
    serializer_class = CoachAthleteLinkSerializer
    permission_classes = [IsAthlete]

    def get_queryset(self):
        return CoachAthleteLink.objects.filter(athlete__user=self.request.user)


class SelfAttendanceView(APIView):
    """Athlete self-checks in for today (BFR §4.1 dual-entry: QR / geofence).

    Geofence/QR validation is stubbed for now; the source is recorded so the
    coach can see how the check-in was made.
    """
    permission_classes = [IsAthlete]

    def post(self, request):
        athlete = _athlete_profile(request.user)
        method = request.data.get('method', 'self')
        source = {'qr': 'self_qr', 'geofence': 'self_geo'}.get(method, 'self')

        batch = None
        batch_id = request.data.get('batch_id')
        if batch_id:
            batch = Batch.objects.filter(pk=batch_id, athletes=athlete).first()
            if not batch:
                return Response(
                    {'detail': 'You are not a member of that batch.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        record, created = AttendanceRecord.objects.update_or_create(
            athlete=athlete, batch=batch, date=timezone.localdate(),
            defaults={'status': AttendanceStatus.PRESENT, 'source': source},
        )
        return Response(
            {
                'message': 'Checked in.' if created else 'Attendance already marked for today.',
                'record': AttendanceRecordSerializer(record).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MyAttendanceView(APIView):
    """Athlete views their own attendance history + percentage."""
    permission_classes = [IsAthlete]

    def get(self, request):
        athlete = _athlete_profile(request.user)
        records = athlete.attendance.all()[:60]
        total = athlete.attendance.count()
        present_like = athlete.attendance.filter(status__in=['present', 'late']).count()
        pct = round(100 * present_like / total) if total else 0
        return Response({
            'attendance_pct': pct,
            'total_sessions': total,
            'records': AttendanceRecordSerializer(records, many=True).data,
        })


class MyBatchesView(APIView):
    """Batches the athlete belongs to (for self check-in selection)."""
    permission_classes = [IsAthlete]

    def get(self, request):
        athlete = _athlete_profile(request.user)
        batches = athlete.batches.all()
        return Response([
            {'id': b.id, 'name': b.name, 'days': b.day_list} for b in batches
        ])


# --- Parent persona (BFR §1.3: read-only access to a linked child) ----------

def _child_summary(athlete: AthleteProfile) -> dict:
    total = athlete.attendance.count()
    present = athlete.attendance.filter(status__in=['present', 'late']).count()
    return {
        'id': athlete.id,
        'full_name': athlete.user.full_name,
        'discipline': athlete.discipline,
        'current_tier': athlete.current_tier,
        'age_category': athlete.age_category,
        'coach_name': athlete.coach.user.full_name if athlete.coach else '',
        'attendance_pct': round(100 * present / total) if total else 0,
    }


class ParentLinkRequestView(APIView):
    """Parent submits a child's mobile -> pending request (athlete approves)."""
    permission_classes = [IsParent]

    def post(self, request):
        mobile = (request.data.get('athlete_mobile') or '').strip()
        athlete_user = User.objects.filter(mobile=mobile, persona=Persona.ATHLETE).first()
        if not athlete_user:
            return Response({'detail': 'Athlete not found.'}, status=status.HTTP_404_NOT_FOUND)
        athlete, _ = AthleteProfile.objects.get_or_create(user=athlete_user)
        link, created = ParentChildLink.objects.get_or_create(
            parent=_parent_profile(request.user), athlete=athlete, status='pending'
        )
        return Response(
            {'message': 'Request sent. Awaiting your child\'s approval.', 'already_pending': not created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MyChildrenView(APIView):
    """Parent lists their approved children with quick summaries."""
    permission_classes = [IsParent]

    def get(self, request):
        children = AthleteProfile.objects.filter(parent=_parent_profile(request.user))
        return Response([_child_summary(a) for a in children])


class ChildDetailView(APIView):
    """Parent read-only view of a linked child's attendance / evaluations / diary."""
    permission_classes = [IsParent]

    def get(self, request, athlete_id):
        athlete = AthleteProfile.objects.filter(
            pk=athlete_id, parent=_parent_profile(request.user)
        ).first()
        if not athlete:
            return Response({'detail': 'Child not linked to you.'}, status=status.HTTP_404_NOT_FOUND)
        from apps.performance.serializers import (
            DiaryEntrySerializer,
            EvaluationSerializer,
        )
        return Response({
            'summary': _child_summary(athlete),
            'attendance': AttendanceRecordSerializer(athlete.attendance.all()[:30], many=True).data,
            'evaluations': EvaluationSerializer(athlete.evaluations.all(), many=True).data,
            'diary': DiaryEntrySerializer(athlete.diary_entries.all()[:30], many=True).data,
        })


# --- Athlete: respond to parent link requests --------------------------------

class ParentRequestsView(APIView):
    """Athlete sees pending parent requests and approves/rejects them."""
    permission_classes = [IsAthlete]

    def get(self, request):
        athlete = _athlete_profile(request.user)
        pending = ParentChildLink.objects.filter(athlete=athlete, status='pending')
        return Response([
            {'id': l.id, 'parent_name': l.parent.user.full_name or l.parent.user.identifier}
            for l in pending
        ])

    def post(self, request, pk, action):
        athlete = _athlete_profile(request.user)
        link = ParentChildLink.objects.filter(pk=pk, athlete=athlete, status='pending').first()
        if not link:
            return Response({'detail': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        if action == 'approve':
            link.approve()
            return Response({'message': 'Parent access granted.'})
        if action == 'reject':
            link.reject()
            return Response({'message': 'Request rejected.'})
        return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
