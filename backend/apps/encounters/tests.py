"""
Encounters app tests.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.departments.models import Department
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
        )
        self.department = Department.objects.get(name="General")

        self.encounter_data = {
            "patient": self.patient.id,
            "department": self.department.id,
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

    def test_create_encounter_references_department(self):
        """A created encounter references the selected department."""
        response = self.client.post(
            "/api/encounters/", self.encounter_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(response.data["department"]), str(self.department.id))
        self.assertEqual(response.data["department_name"], "General")

    def test_encounter_requires_department(self):
        """An encounter cannot be created without a department."""
        data = {"patient": self.patient.id, "notes": "No department"}
        response = self.client.post("/api/encounters/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department", response.data)

    def test_encounter_rejects_unknown_department(self):
        """A non-existent department id is rejected."""
        import uuid

        data = {
            "patient": self.patient.id,
            "department": str(uuid.uuid4()),
        }
        response = self.client.post("/api/encounters/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department", response.data)

    def test_follow_up_encounter_reuses_patient(self):
        """A returning patient gets a second encounter — no new patient record."""
        patients_before = Patient.objects.count()

        first = self.client.post(
            "/api/encounters/", self.encounter_data, format="json"
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(
            "/api/encounters/", self.encounter_data, format="json"
        )
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Patient.objects.count(), patients_before)
        self.assertEqual(first.data["patient"], second.data["patient"])
        self.assertNotEqual(first.data["id"], second.data["id"])

        # Both encounters belong to the same patient and are retrievable.
        response = self.client.get(f"/api/patients/{self.patient.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_encounters(self):
        """Test listing encounters."""
        Encounter.objects.create(
            patient=self.patient,
            doctor=self.user,
            department=self.department,
        )

        response = self.client.get("/api/encounters/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_retrieve_encounter(self):
        """Test retrieving a single encounter."""
        encounter = Encounter.objects.create(
            patient=self.patient,
            doctor=self.user,
            department=self.department,
        )

        response = self.client.get(f"/api/encounters/{encounter.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "in_progress")
        self.assertEqual(response.data["department_name"], "General")

    def test_end_encounter(self):
        """Test ending an encounter."""
        encounter = Encounter.objects.create(
            patient=self.patient,
            doctor=self.user,
            department=self.department,
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
            department=self.department,
            status=Encounter.Status.COMPLETED,
        )

        response = self.client.post(f"/api/encounters/{encounter.id}/end/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_create_encounter_for_hospital_wide_patient(self):
        """Any authenticated clinician may open an encounter for any patient
        (read access is hospital-wide; patients do not belong to doctors)."""
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
            {"patient": other_patient.id, "department": self.department.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The encounter still belongs to the authenticated doctor.
        self.assertEqual(response.data["doctor"], self.user.id)

    def test_cannot_end_other_users_encounter(self):
        """Only the encounter's own doctor (or staff) may end it."""
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
            department=self.department,
        )

        response = self.client.post(f"/api/encounters/{other_encounter.id}/end/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        other_encounter.refresh_from_db()
        self.assertEqual(other_encounter.status, "in_progress")

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access encounters."""
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/encounters/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_read_access_is_hospital_wide(self):
        """A patient's history follows them — any authenticated clinician
        may read any encounter."""
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
            department=self.department,
        )

        response = self.client.get(f"/api/encounters/{other_encounter.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class EncounterWorkflowTests(APITestCase):
    """Department workflow: doctor derived from auth, filters, history."""

    def setUp(self):
        self.doctor = User.objects.create_user(
            username="dr_workflow",
            email="workflow@example.com",
            password="TestPass123!",
            first_name="Workflow",
            last_name="Doctor",
            role="doctor",
        )
        self.client.force_authenticate(user=self.doctor)

        self.patient = Patient.objects.create(
            created_by=self.doctor,
            first_name="Jane",
            last_name="Doe",
            date_of_birth="1990-01-15",
            gender="F",
        )
        self.pediatrics = Department.objects.get(name="Pediatrics")
        self.surgery = Department.objects.get(name="Surgery")

    def test_doctor_derived_from_authenticated_user(self):
        """A payload naming another doctor cannot impersonate them."""
        other = User.objects.create_user(
            username="dr_victim",
            email="victim@example.com",
            password="TestPass123!",
        )

        response = self.client.post(
            "/api/encounters/",
            {
                "patient": str(self.patient.id),
                "department": str(self.pediatrics.id),
                "doctor": str(other.id),  # ignored — server derives doctor
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["doctor"], self.doctor.id)
        encounter = Encounter.objects.get(id=response.data["id"])
        self.assertEqual(encounter.doctor_id, self.doctor.id)

    def test_filter_by_department(self):
        """?department= returns only that department's encounters."""
        e1 = Encounter.objects.create(
            patient=self.patient, doctor=self.doctor, department=self.pediatrics
        )
        Encounter.objects.create(
            patient=self.patient, doctor=self.doctor, department=self.surgery
        )

        response = self.client.get(f"/api/encounters/?department={self.pediatrics.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [r["id"] for r in response.data["results"]]
        self.assertEqual(ids, [str(e1.id)])

    def test_filter_by_patient_returns_longitudinal_history(self):
        """?patient= returns the patient's encounters across departments."""
        Encounter.objects.create(
            patient=self.patient, doctor=self.doctor, department=self.pediatrics
        )
        Encounter.objects.create(
            patient=self.patient, doctor=self.doctor, department=self.surgery
        )

        response = self.client.get(f"/api/encounters/?patient={self.patient.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        dept_names = {r["department_name"] for r in results}
        self.assertEqual(dept_names, {"Pediatrics", "Surgery"})
        # Every row identifies the patient and doctor.
        for row in results:
            self.assertEqual(row["patient_name"], "Jane Doe")
            self.assertEqual(row["doctor_name"], "Workflow Doctor")
            self.assertTrue(row["patient_uhi"].startswith("UHI-"))

    def test_patient_stays_single_record_across_departments(self):
        """Follow-ups in new departments never duplicate the patient."""
        self.client.post(
            "/api/encounters/",
            {"patient": str(self.patient.id), "department": str(self.pediatrics.id)},
            format="json",
        )
        self.client.post(
            "/api/encounters/",
            {"patient": str(self.patient.id), "department": str(self.surgery.id)},
            format="json",
        )

        self.assertEqual(Patient.objects.count(), 1)
        self.assertEqual(Encounter.objects.count(), 2)

    def test_unauthenticated_cannot_create_encounter(self):
        """Encounter creation requires authentication."""
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/encounters/",
            {"patient": str(self.patient.id), "department": str(self.pediatrics.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
