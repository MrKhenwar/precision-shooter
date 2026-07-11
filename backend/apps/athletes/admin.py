from django.contrib import admin

from .models import AthleteProfile, Club, CoachAthleteLink


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ['name', 'state']
    search_fields = ['name', 'state']


@admin.register(AthleteProfile)
class AthleteProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'discipline', 'current_tier', 'coach', 'is_coached']
    list_filter = ['discipline', 'current_tier', 'gender']
    search_fields = ['user__first_name', 'user__last_name', 'shooting_assoc_id']


@admin.register(CoachAthleteLink)
class CoachAthleteLinkAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'coach', 'status', 'requested_at', 'responded_at']
    list_filter = ['status']
