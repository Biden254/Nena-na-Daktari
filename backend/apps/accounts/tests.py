"""
Accounts app tests.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RegisterTests(APITestCase):
    """Test user registration."""

    def test_register_success(self):
        """Test successful user registration."""
        data = {
            "username": "dr_test",
            "email": "test@example.com",
            "password": "TestPass123!",
            "password_confirm": "TestPass123!",
            "first_name": "Test",
            "last_name": "Doctor",
            "role": "doctor",
        }
        response = self.client.post("/api/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.data)
        self.assertIn("tokens", response.data)
        self.assertEqual(response.data["user"]["username"], "dr_test")

    def test_register_password_mismatch(self):
        """Test registration with mismatched passwords."""
        data = {
            "username": "dr_test",
            "email": "test@example.com",
            "password": "TestPass123!",
            "password_confirm": "DifferentPass123!",
            "first_name": "Test",
            "last_name": "Doctor",
            "role": "doctor",
        }
        response = self.client.post("/api/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuthTests(APITestCase):
    """Test authentication flow."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="dr_test",
            email="test@example.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Doctor",
            role="doctor",
        )

    def test_obtain_token(self):
        """Test obtaining JWT token pair."""
        data = {
            "username": "dr_test",
            "password": "TestPass123!",
        }
        response = self.client.post("/api/auth/token/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_profile_authenticated(self):
        """Test accessing profile with valid token."""
        # Get token
        data = {"username": "dr_test", "password": "TestPass123!"}
        token_response = self.client.post("/api/auth/token/", data, format="json")
        token = token_response.data["access"]

        # Access profile
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "dr_test")

    def test_profile_unauthenticated(self):
        """Test accessing profile without token."""
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
