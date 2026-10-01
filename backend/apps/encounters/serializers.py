"""
Encounters serializers for API operations.
"""

from rest_framework import serializers

from apps.patients.serializers import PatientListSerializer

from .models import Encounter


class EncounterSerializer(serializers.ModelSerializer):
    """Serializer for Encounter model - full details."""

    patient_name = serializers.SerializerMethodField()
    patient_uhi = serializers.CharField(source="patient.uhi", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Encounter
        fields = [
            "id",
            "patient",
            "patient_name",
            "patient_uhi",
            "doctor",
            "doctor_name",
            "department",
            "department_name",
            "status",
            "started_at",
            "ended_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "doctor", "started_at", "created_at", "updated_at"]

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username


class EncounterCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating an encounter.

    `doctor` is deliberately not an accepted field: it is always derived
    from the authenticated user, so a client cannot impersonate another doctor.
    """

    class Meta:
        model = Encounter
        # Every encounter references a patient and a department
        # (Patient -> Encounter -> Department).
        fields = ["patient", "department", "notes"]

    def create(self, validated_data):
        """Set the doctor to the current user."""
        validated_data["doctor"] = self.context["request"].user
        return super().create(validated_data)


class EncounterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for encounter lists."""

    patient_name = serializers.SerializerMethodField()
    patient_uhi = serializers.CharField(source="patient.uhi", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Encounter
        fields = [
            "id",
            "patient",
            "patient_name",
            "patient_uhi",
            "doctor",
            "doctor_name",
            "department",
            "department_name",
            "status",
            "started_at",
            "ended_at",
        ]

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username
