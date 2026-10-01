"""
Accounts admin configuration.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Hospital management for doctor accounts.

    Administrators can search doctors, activate/deactivate them
    (is_active), and assign them to one or more departments here.
    """

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
        "is_staff",
    )
    list_filter = ("role", "departments", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "first_name", "last_name", "email")
    # Backs the doctor autocomplete on the Encounter admin.
    ordering = ("username",)
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Role Information",
            {"fields": ("role", "departments")},
        ),
    )
    filter_horizontal = ("departments",)
    actions = ("activate_selected", "deactivate_selected")

    @admin.action(description="Activate selected doctor accounts")
    def activate_selected(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} account(s) activated.")

    @admin.action(description="Deactivate selected doctor accounts")
    def deactivate_selected(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} account(s) deactivated.")
