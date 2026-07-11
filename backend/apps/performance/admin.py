from django.contrib import admin

from .models import DiaryEntry, Evaluation, ShootingRecord


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'kind', 'date', 'shooting_score', 'sc_score', 'overall_score']
    list_filter = ['kind', 'date']


@admin.register(ShootingRecord)
class ShootingRecordAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'date', 'total_shots', 'inner_tens', 'grouping_mm']
    list_filter = ['date']


@admin.register(DiaryEntry)
class DiaryEntryAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'date', 'sleep_quality', 'resting_hr', 'stress_level']
    list_filter = ['date']
