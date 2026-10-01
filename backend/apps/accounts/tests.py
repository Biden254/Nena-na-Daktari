"""
Accounts app tests.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
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


class AdminAccessTests(TestCase):
    """Django Admin is restricted to staff — clinical users are blocked."""

    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="root",
            email="root@example.com",
            password="AdminPass123!",
        )
        self.doctor = User.objects.create_user(
            username="dr_clinic",
            email="clinic@example.com",
            password="TestPass123!",
            role="doctor",
        )

    def test_doctor_cannot_access_admin(self):
        """A normal clinical user is redirected away from Django Admin."""
        self.client.force_login(self.doctor)
        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn("/admin/login", response["Location"])

    def test_anonymous_redirected_to_admin_login(self):
        """Unauthenticated users cannot reach the admin index."""
        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn("/admin/login", response["Location"])

    def test_superuser_can_access_admin(self):
        """A staff superuser reaches the admin index."""
        self.client.force_login(self.superuser)
        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_registered_models_are_manageable(self):
        """Departments, doctors, patients, and encounters are all registered."""
        self.client.force_login(self.superuser)
        urls = [
            "/admin/departments/department/",
            "/admin/accounts/user/",
            "/admin/patients/patient/",
            "/admin/encounters/encounter/",
        ]
        for url in urls:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patient_admin_searches_by_name_and_uhi(self):
        """Admin can find a patient by name or by UHI."""
        from apps.patients.models import Patient

        patient = Patient.objects.create(
            created_by=self.superuser,
            first_name="Zawadi",
            last_name="Mwangi",
            date_of_birth="1992-04-04",
            gender="F",
        )
        self.client.force_login(self.superuser)

        by_name = self.client.get("/admin/patients/patient/?q=Zawadi")
        self.assertContains(by_name, "Zawadi")

        by_uhi = self.client.get(f"/admin/patients/patient/?q={patient.uhi}")
        self.assertContains(by_uhi, patient.uhi)

    def test_doctor_can_be_assigned_to_departments_in_admin(self):
        """The doctor change form manages the M2M department assignment."""
        from apps.departments.models import Department

        peds = Department.objects.get(name="Pediatrics")
        self.client.force_login(self.superuser)
        response = self.client.get(f"/admin/accounts/user/{self.doctor.id}/change/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # filter_horizontal renders the M2M departments widget.
        self.assertContains(response, "departments")
        self.assertContains(response, "Pediatrics")

    def test_doctor_activation_toggle_in_admin(self):
        """Admin can deactivate and reactivate a doctor account."""
        self.client.force_login(self.superuser)
        self.assertTrue(self.doctor.is_active)

        # Deactivate via the admin action.
        response = self.client.post(
            "/admin/accounts/user/",
            {
                "action": "deactivate_selected",
                "_selected_action": [str(self.doctor.id)],
                "index": 0,
            },
            follow=True,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertFalse(self.doctor.is_active)
