"""
Encounters views for API operations.
"""

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Encounter
from .serializers import (
    EncounterCreateSerializer,
    EncounterListSerializer,
    EncounterSerializer,
)


class IsDoctorOrReadOnly(permissions.BasePermission):
    """
    Any authenticated clinician may READ an encounter (a patient's history
    follows them across departments and doctors), but only the doctor who
    performed it (or staff) may modify or end it.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.doctor_id == request.user.id or request.user.is_staff


class EncounterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Encounter operations.

    Provides list, create, retrieve, update, and custom end action.

    The doctor is always derived from the authenticated user — the client
    can never submit another doctor's identity.

    Optional filters:
        ?department=<id>  encounters for one department
        ?patient=<id>     the longitudinal history of one patient
    """

    permission_classes = [permissions.IsAuthenticated, IsDoctorOrReadOnly]

    def get_queryset(self):
        """
        All encounters are readable by authenticated clinicians.
        Object-level writes are restricted to the encounter's own doctor.
        """
        queryset = Encounter.objects.all()

        department = self.request.query_params.get("department")
        if department:
            queryset = queryset.filter(department_id=department)

        patient = self.request.query_params.get("patient")
        if patient:
            queryset = queryset.filter(patient_id=patient)

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return EncounterListSerializer
        elif self.action == "create":
            return EncounterCreateSerializer
        return EncounterSerializer

    def create(self, request, *args, **kwargs):
        """Create an encounter and return the full serialized representation."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Return the full EncounterSerializer (with id, patient_name, etc.)
        instance = serializer.instance
        output_serializer = EncounterSerializer(instance, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        """Derive the doctor from the authenticated user — never the payload."""
        serializer.save(doctor=self.request.user)

    @action(detail=True, methods=["post"])
    def end(self, request, pk=None):
        """
        End an encounter.
        Sets status to completed and records ended_at timestamp.
        Only the encounter's own doctor (or staff) may end it.
        """
        encounter = self.get_object()

        if encounter.status == Encounter.Status.COMPLETED:
            return Response(
                {"error": "Encounter is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        encounter.end_encounter()

        return Response(
            EncounterSerializer(encounter).data,
            status=status.HTTP_200_OK,
        )
