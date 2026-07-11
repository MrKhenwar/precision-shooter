from django.contrib import admin

from .models import CoursePlan, TrainingSession


@admin.register(CoursePlan)
class CoursePlanAdmin(admin.ModelAdmin):
    list_display = ['title', 'coach', 'cycle', 'start_date', 'end_date']
    list_filter = ['cycle']


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'athlete', 'date', 'completed']
    list_filter = ['completed', 'date']
