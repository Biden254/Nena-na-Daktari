"""
Patients URL patterns.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "patients"

router = DefaultRouter()
router.register(r"patients", views.PatientViewSet, basename="patient")

urlpatterns = [
    path("", include(router.urls)),
]
