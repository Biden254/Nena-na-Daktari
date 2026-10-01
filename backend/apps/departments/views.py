"""
Departments views for API operations.
"""

from rest_framework import permissions, viewsets

from .models import Department
from .serializers import DepartmentDetailSerializer, DepartmentSerializer


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for Department reference data.

    Departments are seeded by migration and cannot be created or
    modified through the API.
    """

    permission_classes = [permissions.IsAuthenticated]
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    pagination_class = None  # Small reference dataset — return full list.

    def get_serializer_class(self):
        # Detail responses include `is_assigned` for the current doctor.
        if self.action == "retrieve":
            return DepartmentDetailSerializer
        return DepartmentSerializer
