"""
Core views - shared across all modules.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint.
    Returns service status and basic information.
    """
    return Response(
        {
            "status": "healthy",
            "service": "nnd-api",
            "version": "1.0.0",
        },
        status=status.HTTP_200_OK,
    )
