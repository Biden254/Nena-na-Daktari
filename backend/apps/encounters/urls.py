"""
Encounters URL patterns.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "encounters"

router = DefaultRouter()
router.register(r"encounters", views.EncounterViewSet, basename="encounter")

urlpatterns = [
    path("", include(router.urls)),
]
