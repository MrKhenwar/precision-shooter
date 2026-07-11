from django.contrib import admin

from .models import (
    AttendanceRecord,
    Batch,
    CoachProfile,
    ExpertProfile,
    ParentProfile,
)


@admin.register(CoachProfile)
class CoachProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'license_type', 'experience_years', 'active_athlete_count']
    search_fields = ['user__first_name', 'user__last_name', 'license_number']


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ['user']


@admin.register(ExpertProfile)
class ExpertProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'degree', 'experience_years']


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['name', 'coach', 'capacity', 'member_count', 'days']
    search_fields = ['name']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'batch', 'date', 'status', 'source']
    list_filter = ['status', 'source', 'date']
    date_hierarchy = 'date'
