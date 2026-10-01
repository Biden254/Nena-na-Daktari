"""
Patients views for API operations.
"""

from rest_framework import permissions, status, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from .models import Patient
from .serializers import PatientCreateSerializer, PatientListSerializer, PatientSerializer


class IsCreatorOrReadOnly(permissions.BasePermission):
    """
    Any authenticated clinician may READ a patient record (hospital-wide),
    but only the doctor who created it (or staff) may modify or delete it.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.created_by_id == request.user.id or request.user.is_staff


class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Patient CRUD operations.

    Provides list, create, retrieve, update, and delete.

    Read access is hospital-wide for authenticated clinicians so a patient's
    history follows them across departments and doctors. Writes are restricted
    to the creating doctor (or staff) — manipulating an ID cannot grant
    write access to someone else's patient.
    """

    permission_classes = [permissions.IsAuthenticated, IsCreatorOrReadOnly]
    filter_backends = [SearchFilter]
    # Name search for returning patients. `uhi` supports lookup by hospital
    # identifier. national_id is deliberately excluded — never searched or
    # exposed.
    search_fields = ["first_name", "last_name", "uhi", "phone"]

    def get_queryset(self):
        """All patients are readable by authenticated clinicians."""
        return Patient.objects.all()

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
