"""
Accounts URL patterns for authentication.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

app_name = "accounts"

urlpatterns = [
    # JWT Authentication
    path("token/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # User management
    path("register/", views.RegisterView.as_view(), name="register"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
]
