"""
Departments app tests.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Department

User = get_user_model()

INITIAL_DEPARTMENTS = {
    "Pediatrics",
    "Surgery",
    "Internal Medicine",
    "Obstetrics & Gynaecology",
    "Mental Health & Psychiatry",
    "General",
}


class DepartmentTests(APITestCase):
    """Test seeded departments and their retrieval via the API."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="dr_dept",
            email="dept@example.com",
            password="TestPass123!",
            first_name="Dept",
            last_name="Doctor",
            role="doctor",
        )
        self.client.force_authenticate(user=self.user)

    def test_all_six_departments_exist(self):
        """The six product-defined departments exist as records."""
        names = set(Department.objects.values_list("name", flat=True))
        self.assertEqual(names, INITIAL_DEPARTMENTS)

    def test_department_ids_are_unique(self):
        """Each department has its own identifier."""
        ids = list(Department.objects.values_list("id", flat=True))
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(ids), 6)

    def test_departments_retrievable_via_api(self):
        """An authenticated user can retrieve all departments."""
        response = self.client.get("/api/departments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)
        self.assertEqual({d["name"] for d in response.data}, INITIAL_DEPARTMENTS)

    def test_departments_require_authentication(self):
        """Unauthenticated users cannot access department data."""
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/departments/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_departments_are_read_only_via_api(self):
        """Departments cannot be created through the API."""
        response = self.client.post(
            "/api/departments/", {"name": "Made Up Dept"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_doctor_department_assignment_is_many_to_many(self):
        """A doctor works in multiple departments; a department has many doctors."""
        peds = Department.objects.get(name="Pediatrics")
        surgery = Department.objects.get(name="Surgery")
        other = User.objects.create_user(
            username="dr_colleague",
            email="colleague@example.com",
            password="TestPass123!",
        )

        self.user.departments.add(peds, surgery)
        other.departments.add(peds)

        self.assertEqual(set(self.user.departments.all()), {peds, surgery})
        self.assertEqual(set(peds.doctors.all()), {self.user, other})
        # Removing a department does not affect the doctor's other assignments.
        self.user.departments.remove(peds)
        self.assertEqual(list(self.user.departments.all()), [surgery])
        self.assertEqual(list(peds.doctors.all()), [other])

    def test_department_detail_reports_assignment(self):
        """The detail endpoint tells the frontend if the current doctor
        is assigned to this department (informational only)."""
        peds = Department.objects.get(name="Pediatrics")
        surgery = Department.objects.get(name="Surgery")
        self.user.departments.add(peds)

        response = self.client.get(f"/api/departments/{peds.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_assigned"])

        response = self.client.get(f"/api/departments/{surgery.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_assigned"])

    def test_profile_lists_doctor_departments(self):
        """The auth profile exposes the doctor's assigned departments."""
        peds = Department.objects.get(name="Pediatrics")
        self.user.departments.add(peds)

        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["departments"], [{"id": peds.id, "name": "Pediatrics"}]
        )
