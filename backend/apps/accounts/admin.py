from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import OTPCode, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ['-date_joined']
    list_display = ['identifier', 'persona', 'full_name', 'is_verified', 'is_active']
    list_filter = ['persona', 'is_verified', 'is_active', 'is_staff']
    search_fields = ['email', 'mobile', 'first_name', 'last_name']
    readonly_fields = ['date_joined', 'last_login', 'active_device_id']
    fieldsets = (
        (None, {'fields': ('email', 'mobile', 'password')}),
        ('Personal', {'fields': ('first_name', 'last_name', 'persona', 'expert_type')}),
        ('Status', {'fields': ('is_verified', 'is_active', 'active_device_id')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'mobile', 'persona', 'password1', 'password2'),
        }),
    )


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ['user', 'code', 'created_at', 'consumed_at']
    readonly_fields = ['user', 'code', 'created_at', 'consumed_at']
