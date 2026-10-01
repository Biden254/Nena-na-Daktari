"""
Departments serializers for API operations.
"""

from rest_framework import serializers

from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model."""

    class Meta:
        model = Department
        fields = ["id", "name"]
        read_only_fields = ["id", "name"]


class DepartmentDetailSerializer(DepartmentSerializer):
    """
    Department with context for the current doctor.

    `is_assigned` tells the frontend whether the authenticated doctor is
    assigned to this department in Django Admin (informational only).
    """

    is_assigned = serializers.SerializerMethodField()

    class Meta(DepartmentSerializer.Meta):
        fields = ["id", "name", "is_assigned"]

    def get_is_assigned(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        # Avoid a second query when the list endpoint prefetched assignments.
        return obj.doctors.filter(pk=request.user.pk).exists()
