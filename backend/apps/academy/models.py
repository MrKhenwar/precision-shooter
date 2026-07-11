"""Fees & Inventory utilities (BFR §4.5).

  - FeeRecord: per-athlete monthly coaching fee (Paid / Pending / Overdue)
  - InventoryItem: club assets with serial tracking, assignment, and the
    cylinder 10-year expiry alert (flag 3 months before expiry).
"""
from __future__ import annotations

from datetime import timedelta

from django.db import models
from django.utils import timezone


class FeeStatus(models.TextChoices):
    PAID = 'paid', 'Paid'
    PENDING = 'pending', 'Pending'
    OVERDUE = 'overdue', 'Overdue'


class FeeRecord(models.Model):
    coach = models.ForeignKey(
        'coaching.CoachProfile', on_delete=models.CASCADE, related_name='fee_records'
    )
    athlete = models.ForeignKey(
        'athletes.AthleteProfile', on_delete=models.CASCADE, related_name='fee_records'
    )
    # Billing month as "YYYY-MM".
    period = models.CharField(max_length=7)
    amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=FeeStatus.choices, default=FeeStatus.PENDING)
    due_date = models.DateField(null=True, blank=True)
    paid_on = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-period']
        unique_together = ('coach', 'athlete', 'period')

    def __str__(self):
        return f'{self.athlete} · {self.period} · {self.status}'


class ItemCategory(models.TextChoices):
    RIFLE = 'rifle', 'Air Rifle'
    PISTOL = 'pistol', 'Air Pistol'
    CYLINDER = 'cylinder', 'Compressed Air Cylinder'
    JACKET = 'jacket', 'Jacket'
    TROUSER = 'trouser', 'Trousers'
    OTHER = 'other', 'Other'


# A compressed-air cylinder is valid for 10 years; warn 3 months prior.
CYLINDER_LIFE_YEARS = 10
EXPIRY_WARN_DAYS = 90


class InventoryItem(models.Model):
    coach = models.ForeignKey(
        'coaching.CoachProfile', on_delete=models.CASCADE, related_name='inventory'
    )
    category = models.CharField(max_length=12, choices=ItemCategory.choices)
    name = models.CharField(max_length=120)
    serial_number = models.CharField(max_length=120, blank=True)
    assigned_to = models.ForeignKey(
        'athletes.AthleteProfile', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_kit'
    )
    # For cylinders: the official expiry date (manufacture + 10 years).
    cylinder_expiry = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.category})'

    @property
    def days_to_expiry(self):
        if not self.cylinder_expiry:
            return None
        return (self.cylinder_expiry - timezone.localdate()).days

    @property
    def expiry_alert(self) -> bool:
        """True when a cylinder is within the 90-day warning window (or expired)."""
        d = self.days_to_expiry
        return d is not None and d <= EXPIRY_WARN_DAYS
