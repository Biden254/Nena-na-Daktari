"""
Departments URL patterns.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "departments"

router = DefaultRouter()
router.register(r"departments", views.DepartmentViewSet, basename="department")

urlpatterns = [
    path("", include(router.urls)),
]
