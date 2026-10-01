"""
Add the system-generated Unique Hospital Identifier (UHI) to patients.

Staged so existing data is handled safely:
1. Add the column as nullable (the unique index is created while every
   existing value is NULL — allowed on both SQLite and PostgreSQL).
2. Backfill a unique UHI for every existing patient.
3. Enforce NOT NULL once every row has a value.

No data is deleted or reset.
"""

import secrets

from django.db import migrations, models
from django.db.models import Q

# Must match apps/patients/models.py — duplicated here because data
# migrations cannot use model methods (historical models are field-only).
UHI_PREFIX = "UHI-"
UHI_LENGTH = 6
UHI_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def assign_uhi_to_existing_patients(apps, schema_editor):
    """Give every existing patient a permanent unique UHI."""
    Patient = apps.get_model("patients", "Patient")
    pending = Patient.objects.filter(Q(uhi__isnull=True) | Q(uhi=""))
    for patient in pending.iterator():
        while True:
            candidate = UHI_PREFIX + "".join(
                secrets.choice(UHI_ALPHABET) for _ in range(UHI_LENGTH)
            )
            if not Patient.objects.filter(uhi=candidate).exists():
                patient.uhi = candidate
                patient.save(update_fields=["uhi"])
                break


class Migration(migrations.Migration):

    dependencies = [
        ("patients", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="patient",
            name="uhi",
            field=models.CharField(
                editable=False,
                help_text="System-generated Unique Hospital Identifier",
                max_length=10,
                null=True,
                unique=True,
            ),
        ),
        migrations.RunPython(
            assign_uhi_to_existing_patients,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="patient",
            name="uhi",
            field=models.CharField(
                editable=False,
                help_text="System-generated Unique Hospital Identifier",
                max_length=10,
                unique=True,
            ),
        ),
    ]
