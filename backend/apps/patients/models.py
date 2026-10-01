"""
Patients app models.
Minimum patient fields for Sprint 1.
"""

import secrets

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel

# Unique Hospital Identifier (UHI) generation.
UHI_PREFIX = "UHI-"
UHI_LENGTH = 6
# Exclude visually similar characters (I, O, 0, 1).
UHI_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


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

    # Unique Hospital Identifier — system-generated, permanent, never entered by staff.
    uhi = models.CharField(
        max_length=10,
        unique=True,
        editable=False,
        help_text="System-generated Unique Hospital Identifier",
    )

    # Legacy field — no longer collected or exposed by any API or form.
    # Kept in the schema to avoid a destructive migration of existing data.
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

    @classmethod
    def generate_uhi(cls):
        """
        Generate a random Unique Hospital Identifier (e.g. UHI-7K3M9X).

        Server-side only — never exposed for manual entry. A database-level
        uniqueness constraint is the final guarantee against collisions.
        """
        for _ in range(100):
            candidate = UHI_PREFIX + "".join(
                secrets.choice(UHI_ALPHABET) for _ in range(UHI_LENGTH)
            )
            if not cls.objects.filter(uhi=candidate).exists():
                return candidate
        raise RuntimeError("Unable to generate a unique UHI")

    def save(self, *args, **kwargs):
        """Assign a UHI on first save; it never changes afterwards."""
        if not self.uhi:
            self.uhi = self.generate_uhi()
        super().save(*args, **kwargs)
