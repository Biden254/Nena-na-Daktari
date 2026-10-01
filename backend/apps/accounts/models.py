"""
Accounts app models.
Custom User model will be defined here.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model for Nena na Daktari.
    Extends Django's AbstractUser with additional fields.
    """

    class Role(models.TextChoices):
        DOCTOR = "doctor", "Doctor"
        ADMIN = "admin", "Administrator"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.DOCTOR,
    )

    # Doctor <-> Department is many-to-many: a doctor can work in one or
    # multiple departments, and a department has many doctors.
    # Managed from Django Admin. Assignment does not gate encounter access.
    departments = models.ManyToManyField(
        "departments.Department",
        blank=True,
        related_name="doctors",
        help_text="Departments this doctor works in",
    )

    class Meta:
        db_table = "accounts_user"
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return self.get_full_name() or self.username
