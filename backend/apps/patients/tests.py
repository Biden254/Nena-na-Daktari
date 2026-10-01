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

    def test_read_access_is_hospital_wide(self):
        """Any authenticated clinician may read any patient's record."""
        other_user = User.objects.create_user(
            username="dr_other",
            email="other@example.com",
            password="TestPass123!",
        )

        other_patient = Patient.objects.create(
            created_by=other_user,
            **self.patient_data,
        )

        response = self.client.get(f"/api/patients/{other_patient.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_modify_other_users_patients(self):
        """Only the creating doctor (or staff) may modify a patient."""
        other_user = User.objects.create_user(
            username="dr_other",
            email="other@example.com",
            password="TestPass123!",
        )

        other_patient = Patient.objects.create(
            created_by=other_user,
            **self.patient_data,
        )

        # Modify attempt is denied even though reading is allowed.
        response = self.client.patch(
            f"/api/patients/{other_patient.id}/",
            {"first_name": "Hacked"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        other_patient.refresh_from_db()
        self.assertEqual(other_patient.first_name, "John")


class PatientUHITests(APITestCase):
    """Test system-generated Unique Hospital Identifier (UHI)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="dr_uhi",
            email="uhi@example.com",
            password="TestPass123!",
            first_name="UHI",
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
        }

    def test_uhi_generated_on_create(self):
        """Creating a patient returns an automatically generated UHI."""
        response = self.client.post(
            "/api/patients/", self.patient_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        uhi = response.data["uhi"]
        self.assertTrue(uhi.startswith("UHI-"))
        self.assertEqual(len(uhi), 10)
        self.assertTrue(Patient.objects.filter(uhi=uhi).exists())

    def test_uhi_is_unique(self):
        """Two patients never share a UHI."""
        p1 = Patient.objects.create(created_by=self.user, **self.patient_data)
        p2 = Patient.objects.create(created_by=self.user, **self.patient_data)
        self.assertNotEqual(p1.uhi, p2.uhi)

    def test_uhi_does_not_change(self):
        """The UHI stays the same when the patient record is updated."""
        patient = Patient.objects.create(created_by=self.user, **self.patient_data)
        original = patient.uhi

        response = self.client.patch(
            f"/api/patients/{patient.id}/",
            {"first_name": "Jane"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        patient.refresh_from_db()
        self.assertEqual(patient.uhi, original)

    def test_uhi_not_settable_by_client(self):
        """A client cannot force a UHI — it is generated server-side."""
        data = {**self.patient_data, "uhi": "UHI-HACKED"}
        response = self.client.post("/api/patients/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data["uhi"], "UHI-HACKED")

    def test_national_id_not_required(self):
        """Patient registration works without any national identifier."""
        response = self.client.post(
            "/api/patients/", self.patient_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("national_id", response.data)

    def test_national_id_ignored_and_not_stored(self):
        """Sending national_id neither stores nor returns it."""
        data = {**self.patient_data, "national_id": "76543210"}
        response = self.client.post("/api/patients/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("national_id", response.data)
        patient = Patient.objects.get(id=response.data["id"])
        self.assertIsNone(patient.national_id)

    def test_duplicate_names_allowed_with_distinct_uhis(self):
        """Same-name patients coexist and are distinguishable by UHI."""
        Patient.objects.create(created_by=self.user, **self.patient_data)
        Patient.objects.create(created_by=self.user, **self.patient_data)

        response = self.client.get("/api/patients/?search=John")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertEqual(len({r["uhi"] for r in results}), 2)

    def test_search_returns_uhi_without_national_id(self):
        """Search results expose the UHI but never national ID."""
        Patient.objects.create(
            created_by=self.user,
            **{**self.patient_data, "national_id": "76543210"},
        )

        response = self.client.get("/api/patients/?search=John")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertIn("uhi", results[0])
        self.assertNotIn("national_id", results[0])

    def test_search_does_not_match_national_id(self):
        """National ID is not a search field."""
        Patient.objects.create(
            created_by=self.user,
            **{**self.patient_data, "national_id": "76543210"},
        )

        response = self.client.get("/api/patients/?search=76543210")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_search_by_name_returns_matching_patients(self):
        """Backend search by name; no patients are created by searching."""
        Patient.objects.create(created_by=self.user, **self.patient_data)
        before = Patient.objects.count()

        response = self.client.get("/api/patients/?search=John")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(Patient.objects.count(), before)

    def test_search_no_results(self):
        """A name with no matches returns an empty result list."""
        Patient.objects.create(created_by=self.user, **self.patient_data)

        response = self.client.get("/api/patients/?search=Nonexistent")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_empty_search_returns_existing_patients(self):
        """An empty search behaves like a normal list request."""
        Patient.objects.create(created_by=self.user, **self.patient_data)

        response = self.client.get("/api/patients/?search=")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
