"""
Patients app tests.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Patient

User = get_user_model()


class PatientTests(APITestCase):
    """Test Patient CRUD operations."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="dr_test",
            email="test@example.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Doctor",
            role="doctor",
        )
        self.client.force_authenticate(user=self.user)

        self.patient_data = {
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-15",
            "gender": "M",
            "phone": "+254712345678",
            "national_id": "12345678",
        }

    def test_create_patient(self):
        """Test creating a new patient."""
        response = self.client.post(
            "/api/patients/", self.patient_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["first_name"], "John")
        self.assertEqual(response.data["last_name"], "Doe")
        self.assertEqual(response.data["created_by"], self.user.id)

    def test_list_patients(self):
        """Test listing patients."""
        # Create a patient first
        Patient.objects.create(
            created_by=self.user,
            **self.patient_data,
        )

        response = self.client.get("/api/patients/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_retrieve_patient(self):
        """Test retrieving a single patient."""
        patient = Patient.objects.create(
            created_by=self.user,
            **self.patient_data,
        )

        response = self.client.get(f"/api/patients/{patient.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "John")

    def test_update_patient(self):
        """Test updating a patient."""
        patient = Patient.objects.create(
            created_by=self.user,
            **self.patient_data,
        )

        update_data = {"first_name": "Jane"}
        response = self.client.patch(
            f"/api/patients/{patient.id}/", update_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Jane")

    def test_delete_patient(self):
        """Test deleting a patient."""
        patient = Patient.objects.create(
            created_by=self.user,
            **self.patient_data,
        )

        response = self.client.delete(f"/api/patients/{patient.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Patient.objects.filter(id=patient.id).exists())

    def test_search_patients(self):
        """Test searching patients by name."""
        Patient.objects.create(
            created_by=self.user,
            **self.patient_data,
        )

        response = self.client.get("/api/patients/?search=John")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access patients."""
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/patients/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_access_other_users_patients(self):
        """Test that users cannot access patients created by others."""
        other_user = User.objects.create_user(
            username="dr_other",
            email="other@example.com",
            password="TestPass123!",
        )

        # Create patient as other user
        other_patient = Patient.objects.create(
            created_by=other_user,
            **self.patient_data,
        )

        # Try to access as current user
        response = self.client.get(f"/api/patients/{other_patient.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
