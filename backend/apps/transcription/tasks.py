import logging
import os
from typing import Any

from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist

from apps.encounters.models import Encounter
from apps.transcription.models import Transcript, TranscriptionJob

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=1)
def process_transcription_job(self, job_id: str):
    try:
        job = TranscriptionJob.objects.get(id=job_id)
    except ObjectDoesNotExist:
        logger.error("Transcription job %s not found", job_id)
        return {"status": "not_found"}

    try:
        job.status = TranscriptionJob.Status.PROCESSING
        job.save(update_fields=["status", "updated_at"])

        model_size = os.getenv("WHISPER_MODEL_SIZE", "small")
        logger.info("Processing transcription for job %s with model %s", job_id, model_size)

        # Placeholder implementation to satisfy the requested architecture.
        # Real S3 download / whisper transcription will be added in a follow-up pass.
        transcript_text = (
            f"Transcription placeholder for consultation {job.consultation_id}. "
            f"Model: {model_size}."
        )

        transcript = Transcript.objects.create(job=job, text=transcript_text)

        job.status = TranscriptionJob.Status.COMPLETED
        job.error_message = None
        job.save(update_fields=["status", "error_message", "updated_at"])

        return {
            "status": "completed",
            "job_id": str(job.id),
            "transcript_id": str(transcript.id),
        }
    except Exception as exc:  # pragma: no cover - task failure path
        logger.exception("Transcription failed for job %s", job_id)
        job.status = TranscriptionJob.Status.FAILED
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message", "updated_at"])
        return {"status": "failed", "error": str(exc)}
