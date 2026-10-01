"""
Encounters admin configuration.

Filter and search encounters by patient, doctor, department, and date.
Autocomplete is used for patient/doctor relationships to avoid huge
unfiltered dropdowns.
"""

from django.contrib import admin

from .models import Encounter


@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "department", "status", "started_at", "ended_at")
    # Search by patient (name or UHI) and by doctor (name or username).
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "patient__uhi",
        "doctor__username",
        "doctor__first_name",
        "doctor__last_name",
    )
    list_filter = ("department", "status", "started_at")
    date_hierarchy = "started_at"
    ordering = ("-started_at",)
    # Patient and doctor tables grow unboundedly — use autocomplete
    # (backed by the search_fields on their own admins). Department is
    # a tiny reference table, so a plain dropdown is fine.
    autocomplete_fields = ("patient", "doctor")
    readonly_fields = ("id", "started_at", "created_at", "updated_at")
