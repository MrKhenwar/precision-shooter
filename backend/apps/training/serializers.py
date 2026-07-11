"""Serializers for course plans and training sessions."""
from __future__ import annotations

from rest_framework import serializers

from .models import CoursePlan, TrainingSession


class CoursePlanSerializer(serializers.ModelSerializer):
    session_count = serializers.SerializerMethodField()

    class Meta:
        model = CoursePlan
        fields = [
            'id', 'title', 'cycle', 'start_date', 'end_date', 'themes',
            'session_count', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_session_count(self, obj) -> int:
        return obj.sessions.count()


class TrainingSessionSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.user.full_name', read_only=True)

    class Meta:
        model = TrainingSession
        fields = [
            'id', 'athlete', 'athlete_name', 'course_plan', 'date', 'title',
            'drills', 'completed', 'completed_at', 'created_at',
        ]
        read_only_fields = ['completed_at', 'created_at']
