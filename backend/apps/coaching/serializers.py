"""Serializers for coach profile and roster."""
from __future__ import annotations

from rest_framework import serializers

from .models import AttendanceRecord, Batch, CoachProfile, ExpertProfile


class ExpertProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    expert_type = serializers.CharField(source='user.expert_type', read_only=True)

    class Meta:
        model = ExpertProfile
        fields = [
            'id', 'full_name', 'expert_type', 'degree', 'experience_years',
            'service_history', 'bio',
        ]


class CoachProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    active_athlete_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CoachProfile
        fields = [
            'id', 'full_name', 'license_type', 'license_number',
            'experience_years', 'bio', 'active_athlete_count',
        ]


class RosterAthleteSerializer(serializers.Serializer):
    """Compact athlete row for the coach roster."""
    id = serializers.IntegerField()
    full_name = serializers.CharField(source='user.full_name')
    discipline = serializers.CharField()
    current_tier = serializers.CharField()
    age_category = serializers.CharField()


class BatchSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = Batch
        fields = [
            'id', 'name', 'capacity', 'days', 'start_time', 'end_time',
            'member_count', 'is_full', 'created_at',
        ]
        read_only_fields = ['created_at']


class BatchMemberSerializer(serializers.Serializer):
    """Athlete row within a batch."""
    id = serializers.IntegerField()
    full_name = serializers.CharField(source='user.full_name')
    discipline = serializers.CharField()
    current_tier = serializers.CharField()


class AttendanceRecordSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.user.full_name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'athlete', 'athlete_name', 'batch', 'date', 'status', 'source']


class MarkAttendanceSerializer(serializers.Serializer):
    """Bulk-mark a batch's attendance for a given date."""
    date = serializers.DateField(required=False)
    entries = serializers.ListField(child=serializers.DictField(), allow_empty=False)
    # each entry: { "athlete_id": int, "status": "present|absent|late|excused" }
