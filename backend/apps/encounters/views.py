"""
Encounters views for API operations.
"""

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Encounter
from .serializers import (
    EncounterCreateSerializer,
    EncounterListSerializer,
    EncounterSerializer,
)


class EncounterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Encounter operations.

    Provides list, create, retrieve, update, and custom end action.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return only encounters where the user is the doctor.
        This implements object-level authorization.
        """
        return Encounter.objects.filter(doctor=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return EncounterListSerializer
        elif self.action == "create":
            return EncounterCreateSerializer
        return EncounterSerializer

    def perform_create(self, serializer):
        """Set the doctor field to the current user."""
        serializer.save(doctor=self.request.user)

    @action(detail=True, methods=["post"])
    def end(self, request, pk=None):
        """
        End an encounter.
        Sets status to completed and records ended_at timestamp.
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
