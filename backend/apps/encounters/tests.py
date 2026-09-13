"""
Encounters app tests.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.patients.models import Patient

from .models import Encounter

User = get_user_model()


class EncounterTests(APITestCase):
    """Test Encounter operations."""

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

        self.patient = Patient.objects.create(
            created_by=self.user,
            first_name="John",
            last_name="Doe",
            date_of_birth="1990-01-15",
            gender="M",
            phone="+254712345678",
            national_id="12345678",
        )

        self.encounter_data = {
            "patient": self.patient.id,
            "notes": "Initial consultation",
        }

    def test_create_encounter(self):
        """Test creating a new encounter."""
        response = self.client.post(
            "/api/encounters/", self.encounter_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "in_progress")
        self.assertEqual(response.data["doctor"], self.user.id)
        self.assertEqual(response.data["patient"], self.patient.id)

    def test_list_encounters(self):
        """Test listing encounters."""
        Encounter.objects.create(
            patient=self.patient,
            doctor=self.user,
        )

        response = self.client.get("/api/encounters/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_retrieve_encounter(self):
        """Test retrieving a single encounter."""
        encounter = Encounter.objects.create(
            patient=self.patient,
            doctor=self.user,
        )

        response = self.client.get(f"/api/encounters/{encounter.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "in_progress")

    def test_end_encounter(self):
        """Test ending an encounter."""
        encounter = Encounter.objects.create(
            patient=self.patient,
            doctor=self.user,
        )

        response = self.client.post(f"/api/encounters/{encounter.id}/end/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "completed")
        self.assertIsNotNone(response.data["ended_at"])

    def test_cannot_end_completed_encounter(self):
        """Test that completed encounters cannot be ended again."""
        encounter = Encounter.objects.create(
            patient=self.patient,
            doctor=self.user,
            status=Encounter.Status.COMPLETED,
        )

        response = self.client.post(f"/api/encounters/{encounter.id}/end/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_create_encounter_for_other_users_patient(self):
        """Test that users cannot create encounters for other users' patients."""
        other_user = User.objects.create_user(
            username="dr_other",
            email="other@example.com",
            password="TestPass123!",
        )
        other_patient = Patient.objects.create(
            created_by=other_user,
            first_name="Jane",
            last_name="Smith",
            date_of_birth="1985-05-20",
            gender="F",
        )

        response = self.client.post(
            "/api/encounters/",
            {"patient": other_patient.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access encounters."""
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/encounters/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_access_other_users_encounters(self):
        """Test that users cannot access encounters created by others."""
        other_user = User.objects.create_user(
            username="dr_other",
            email="other@example.com",
            password="TestPass123!",
        )
        other_patient = Patient.objects.create(
            created_by=other_user,
            first_name="Jane",
            last_name="Smith",
            date_of_birth="1985-05-20",
            gender="F",
        )
        other_encounter = Encounter.objects.create(
            patient=other_patient,
            doctor=other_user,
        )

        response = self.client.get(f"/api/encounters/{other_encounter.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
