"""
Link every encounter to a department (Patient → Encounter → Department).

Staged so existing data is handled safely:
1. Add the FK as nullable.
2. Backfill existing encounters with the "General" department.
3. Enforce NOT NULL once every row is assigned.

Reverse order means the FK column is dropped before departments 0001
reverses (which deletes the seeded departments), so the PROTECT
constraint never blocks a rollback.
"""

from django.db import migrations, models


def assign_general_department(apps, schema_editor):
    """Point existing encounters at the General department."""
    Department = apps.get_model("departments", "Department")
    Encounter = apps.get_model("encounters", "Encounter")
    general, _ = Department.objects.get_or_create(name="General")
    Encounter.objects.filter(department__isnull=True).update(department=general)


class Migration(migrations.Migration):

    dependencies = [
        ("encounters", "0001_initial"),
        ("departments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="encounter",
            name="department",
            field=models.ForeignKey(
                null=True,
                on_delete=models.PROTECT,
                related_name="encounters",
                to="departments.department",
            ),
        ),
        migrations.RunPython(
            assign_general_department,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="encounter",
            name="department",
            field=models.ForeignKey(
                on_delete=models.PROTECT,
                related_name="encounters",
                to="departments.department",
            ),
        ),
    ]
