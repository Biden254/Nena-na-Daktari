from django.db import models

from apps.core.models import TimeStampedModel
from apps.encounters.models import Encounter


class TranscriptionJob(TimeStampedModel):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    consultation = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="transcription_jobs",
    )
    s3_key = models.CharField(max_length=500)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.QUEUED,
    )
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "transcription_job"
        ordering = ["-created_at"]

    def __str__(self):
        return f"TranscriptionJob {self.id} - {self.consultation_id} ({self.status})"


class Transcript(TimeStampedModel):
    job = models.ForeignKey(
        TranscriptionJob,
        on_delete=models.CASCADE,
        related_name="transcripts",
    )
    text = models.TextField(blank=True, default="")

    class Meta:
        db_table = "transcription_transcript"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Transcript {self.id} for job {self.job_id}"
