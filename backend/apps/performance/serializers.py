"""Serializers for evaluations, shooting records and diary entries."""
from __future__ import annotations

from rest_framework import serializers

from .models import DiaryEntry, Evaluation, ShootingRecord


class EvaluationSerializer(serializers.ModelSerializer):
    shooting_score = serializers.FloatField(read_only=True)
    sc_score = serializers.FloatField(read_only=True)
    overall_score = serializers.FloatField(read_only=True)
    athlete_name = serializers.CharField(source='athlete.user.full_name', read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            'id', 'athlete', 'athlete_name', 'kind', 'date',
            'hold_stability', 'trigger_timing', 'approach', 'follow_through',
            'core_strength', 'cardio_endurance', 'balance_index',
            'shooting_score', 'sc_score', 'overall_score', 'notes', 'created_at',
        ]
        read_only_fields = ['athlete', 'created_at']


class ShootingRecordSerializer(serializers.ModelSerializer):
    inner_ten_pct = serializers.IntegerField(read_only=True)

    class Meta:
        model = ShootingRecord
        fields = [
            'id', 'date', 'total_shots', 'inner_tens', 'inner_ten_pct',
            'grouping_mm', 'total_score', 'notes', 'created_at',
        ]
        read_only_fields = ['created_at']


class DiaryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DiaryEntry
        fields = [
            'id', 'date', 'sleep_quality', 'resting_hr', 'stress_level',
            'notes', 'created_at',
        ]
        read_only_fields = ['created_at']
