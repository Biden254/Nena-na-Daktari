"""
Encounters app models.
Encounter model for tracking doctor-patient consultations.
"""

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Encounter(TimeStampedModel):
    """
    A consultation encounter between a doctor and patient.
    Ready for future audio pipeline and clinical history features.
    """

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    # Relationships
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="encounters",
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="encounters",
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    # Notes
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "encounters_encounter"
        verbose_name = "encounter"
        verbose_name_plural = "encounters"
        ordering = ["-started_at"]

    def __str__(self):
        return f"Encounter {self.id} - {self.patient.full_name} ({self.doctor.full_name})"

    def end_encounter(self):
        """End the encounter and set the ended_at timestamp."""
        from django.utils import timezone

        self.status = self.Status.COMPLETED
        self.ended_at = timezone.now()
        self.save(update_fields=["status", "ended_at", "updated_at"])
