"""
Encounters serializers for API operations.
"""

from rest_framework import serializers

from apps.patients.serializers import PatientListSerializer

from .models import Encounter


class EncounterSerializer(serializers.ModelSerializer):
    """Serializer for Encounter model - full details."""

    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Encounter
        fields = [
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
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
    """Serializer for creating an encounter."""

    class Meta:
        model = Encounter
        fields = ["patient", "notes"]

    def validate_patient(self, value):
        """Ensure the patient belongs to the current user."""
        user = self.context["request"].user
        if value.created_by != user:
            raise serializers.ValidationError(
                "You can only create encounters for your own patients."
            )
        return value

    def create(self, validated_data):
        """Set the doctor to the current user."""
        validated_data["doctor"] = self.context["request"].user
        return super().create(validated_data)


class EncounterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for encounter lists."""

    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Encounter
        fields = [
            "id",
            "patient",
            "patient_name",
            "status",
            "started_at",
            "ended_at",
        ]

    def get_patient_name(self, obj):
        return obj.patient.full_name
