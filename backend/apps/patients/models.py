"""
Patients app models.
Minimum patient fields for Sprint 1.
"""

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Patient(TimeStampedModel):
    """
    Patient record.
    Contains minimum required fields for Sprint 1 clinical identification.
    """

    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"

    # Identity
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(
        max_length=1,
        choices=Gender.choices,
    )

    # Contact
    phone = models.CharField(max_length=20, blank=True, default="")

    # Unique identifier
    national_id = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        help_text="Kenya National ID or other unique patient identifier",
    )

    # Ownership
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_patients",
    )

    class Meta:
        db_table = "patients_patient"
        verbose_name = "patient"
        verbose_name_plural = "patients"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
