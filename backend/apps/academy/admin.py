from django.contrib import admin

from .models import FeeRecord, InventoryItem


@admin.register(FeeRecord)
class FeeRecordAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'period', 'amount', 'status', 'due_date', 'paid_on']
    list_filter = ['status', 'period']


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'serial_number', 'assigned_to', 'cylinder_expiry', 'expiry_alert']
    list_filter = ['category']
