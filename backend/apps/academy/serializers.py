"""Serializers for fees and inventory."""
from __future__ import annotations

from rest_framework import serializers

from .models import FeeRecord, InventoryItem


class FeeRecordSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.user.full_name', read_only=True)

    class Meta:
        model = FeeRecord
        fields = [
            'id', 'athlete', 'athlete_name', 'period', 'amount', 'status',
            'due_date', 'paid_on', 'created_at',
        ]
        read_only_fields = ['created_at']


class InventoryItemSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(
        source='assigned_to.user.full_name', read_only=True, default=''
    )
    days_to_expiry = serializers.IntegerField(read_only=True)
    expiry_alert = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'category', 'name', 'serial_number', 'assigned_to',
            'assigned_to_name', 'cylinder_expiry', 'days_to_expiry',
            'expiry_alert', 'notes', 'created_at',
        ]
        read_only_fields = ['created_at']
