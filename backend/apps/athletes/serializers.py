"""Serializers for athlete profiles and the coach-linkage workflow."""
from __future__ import annotations

from rest_framework import serializers

from .models import AthleteProfile, Club, CoachAthleteLink


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'state']


class AthleteProfileSerializer(serializers.ModelSerializer):
    age_category = serializers.CharField(read_only=True)
    is_coached = serializers.BooleanField(read_only=True)
    trial_end_date = serializers.DateTimeField(read_only=True)
    coach_name = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = AthleteProfile
        fields = [
            'id', 'full_name', 'shooting_assoc_id', 'dob', 'gender',
            'age_category', 'state', 'club', 'dominant_hand', 'dominant_eye',
            'discipline', 'diet_type', 'current_tier', 'coach', 'coach_name',
            'is_coached', 'trial_end_date', 'registered_on',
        ]
        # current_tier is coach-controlled; coach link is set via the workflow.
        read_only_fields = ['current_tier', 'coach', 'registered_on']

    def get_coach_name(self, obj) -> str:
        return obj.coach.user.full_name if obj.coach else ''


class LinkRequestSerializer(serializers.Serializer):
    """Athlete submits a coach's mobile number to request a link."""
    coach_mobile = serializers.CharField()


class CoachAthleteLinkSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.user.full_name', read_only=True)
    athlete_discipline = serializers.CharField(source='athlete.discipline', read_only=True)

    class Meta:
        model = CoachAthleteLink
        fields = [
            'id', 'athlete', 'athlete_name', 'athlete_discipline',
            'coach', 'status', 'requested_at', 'responded_at',
        ]
        read_only_fields = fields


class TierUpdateSerializer(serializers.Serializer):
    """Coach updates an athlete's current tier."""
    tier = serializers.CharField()
