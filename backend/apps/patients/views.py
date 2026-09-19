"""
Patients views for API operations.
"""

from rest_framework import permissions, status, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from .models import Patient
from .serializers import PatientCreateSerializer, PatientListSerializer, PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Patient CRUD operations.

    Provides list, create, retrieve, update, and delete.
    Only authenticated users can access patients.
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ["first_name", "last_name", "national_id", "phone"]

    def get_queryset(self):
        """
        Return only patients created by the current user.
        This implements object-level authorization.
        """
        return Patient.objects.filter(created_by=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        elif self.action == "create":
            return PatientCreateSerializer
        return PatientSerializer

    def create(self, request, *args, **kwargs):
        """Create a patient and return the full serialized representation."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Return the full PatientSerializer (with id, full_name, etc.)
        instance = serializer.instance
        output_serializer = PatientSerializer(instance, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        """Set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)
