"""
Departments admin configuration.

Hospital management for departments: view, create, edit, search,
and see which doctors are assigned and how many encounters they hold.
"""

from django.contrib import admin
from django.db import models

from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "doctor_count", "encounter_count", "created_at")
    search_fields = ("name",)
    ordering = ("name",)
    readonly_fields = ("id", "created_at", "updated_at")

    def get_queryset(self, request):
        # Annotate counts so the list view stays a constant number of queries.
        queryset = super().get_queryset(request)
        return queryset.annotate(
            _doctor_count=models.Count("doctors", distinct=True),
            _encounter_count=models.Count("encounters", distinct=True),
        )

    @admin.display(description="Doctors", ordering="_doctor_count")
    def doctor_count(self, obj):
        return obj._doctor_count

    @admin.display(description="Encounters", ordering="_encounter_count")
    def encounter_count(self, obj):
        return obj._encounter_count
