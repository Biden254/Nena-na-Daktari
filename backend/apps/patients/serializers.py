"""
Patients serializers for API operations.
"""

from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for Patient model - read operations."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "uhi",
            "date_of_birth",
            "gender",
            "phone",
            "created_by",
            "created_at",
            "updated_at",
        ]
        # national_id is intentionally excluded — it is no longer collected
        # or exposed anywhere in the API.
        read_only_fields = ["id", "uhi", "created_by", "created_at", "updated_at"]

    def get_full_name(self, obj):
        return obj.full_name


class PatientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a patient."""

    class Meta:
        model = Patient
        # No national_id — deliberately not collected.
        # uhi is generated server-side and returned by PatientSerializer.
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "gender",
            "phone",
        ]

    def create(self, validated_data):
        # Set the created_by to the current user
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class PatientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for patient lists."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "uhi",
            "date_of_birth",
            "gender",
            "created_at",
        ]

    def get_full_name(self, obj):
        return obj.full_name
