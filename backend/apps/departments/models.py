"""
Departments app models.
Hospital departments associated with encounters.
"""

from django.db import models

from apps.core.models import TimeStampedModel


class Department(TimeStampedModel):
    """
    Hospital department.

    Reference data used to categorise encounters. Will later be consumed
    by the separate AI/RAG component to scope department-relevant knowledge.
    """

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "departments_department"
        verbose_name = "department"
        verbose_name_plural = "departments"
        # Seed order matches the product's canonical department list.
        ordering = ["created_at"]

    def __str__(self):
        return self.name
