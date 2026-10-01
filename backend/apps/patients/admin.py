"""
Patients admin configuration.

Search by name or UHI and inspect a patient's encounters.
National ID is deliberately excluded — it is no longer collected
and must not be exposed.
"""

from django.contrib import admin

from apps.encounters.models import Encounter

from .models import Patient


class EncounterInline(admin.TabularInline):
    """Read-only view of a patient's encounters (their longitudinal history)."""

    model = Encounter
    extra = 0
    can_delete = False
    fields = ("department", "doctor", "status", "started_at", "ended_at")
    readonly_fields = fields
    ordering = ("-started_at",)

    def has_add_permission(self, request, obj=None):
        # Encounters are created through the clinical workflow, not admin.
        return False


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "uhi", "gender", "date_of_birth", "created_at")
    list_filter = ("gender", "created_at")
    search_fields = ("first_name", "last_name", "uhi")
    ordering = ("-created_at",)
    # uhi is system-generated; timestamps are informational.
    readonly_fields = ("id", "uhi", "created_by", "created_at", "updated_at")
    # Legacy identifier: never shown in lists or forms.
    exclude = ("national_id",)
    inlines = (EncounterInline,)
