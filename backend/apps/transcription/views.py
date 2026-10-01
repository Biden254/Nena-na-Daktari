import io
import os
import uuid
from typing import Any

import boto3
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, Http404
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from weasyprint import HTML

from apps.encounters.models import Encounter
from apps.transcription.models import Transcript, TranscriptionJob


class AudioUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, consultation_id=None, *args, **kwargs):
        if not consultation_id:
            return Response({"detail": "Consultation ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            consultation = Encounter.objects.get(id=consultation_id, doctor=request.user)
        except Encounter.DoesNotExist:
            raise PermissionDenied("You do not have access to this consultation.")

        audio_file = request.FILES.get("audio")
        if not audio_file:
            return Response({"detail": "Audio file is required."}, status=status.HTTP_400_BAD_REQUEST)

        bucket_name = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")
        if not bucket_name:
            return Response({"detail": "S3 bucket is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        s3_key = f"pending/{consultation.id}/{uuid.uuid4()}.webm"
        boto_client = boto3.client(
            "s3",
            aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", None),
            aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", None),
            region_name=getattr(settings, "AWS_S3_REGION_NAME", None),
            endpoint_url=getattr(settings, "AWS_S3_ENDPOINT_URL", None) or None,
        )

        boto_client.upload_fileobj(audio_file, bucket_name, s3_key)

        job = TranscriptionJob.objects.create(
            consultation=consultation,
            s3_key=s3_key,
            status=TranscriptionJob.Status.QUEUED,
        )

        from .tasks import process_transcription_job

        process_transcription_job.delay(str(job.id))

        return Response(
            {
                "job_id": str(job.id),
                "status": job.status,
                "s3_key": s3_key,
                "message": "Audio accepted and transcription queued.",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class TranscriptionJobStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id=None, *args, **kwargs):
        if not job_id:
            return Response({"detail": "Job ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = TranscriptionJob.objects.get(id=job_id, consultation__doctor=request.user)
        except TranscriptionJob.DoesNotExist:
            raise PermissionDenied("You do not have access to this transcription job.")

        transcript = job.transcripts.order_by("-created_at").first()
        response_data = {
            "job_id": str(job.id),
            "consultation_id": str(job.consultation_id),
            "status": job.status,
            "error_message": job.error_message,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
        }

        if transcript:
            response_data["transcript"] = {"id": str(transcript.id), "text": transcript.text}

        return Response(response_data, status=status.HTTP_200_OK)


class TranscriptionPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id=None, *args, **kwargs):
        if not job_id:
            return Response({"detail": "Job ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = TranscriptionJob.objects.select_related("consultation", "consultation__patient", "consultation__doctor").get(
                id=job_id,
                consultation__doctor=request.user,
            )
        except TranscriptionJob.DoesNotExist:
            raise PermissionDenied("You do not have access to this transcription job.")

        transcript = job.transcripts.order_by("-created_at").first()
        if not transcript:
            raise Http404("Transcript not found for this job.")

        context = {
            "job": job,
            "transcript": transcript,
            "consultation": job.consultation,
            "patient": job.consultation.patient,
            "doctor": job.consultation.doctor,
            "generated_at": timezone.now(),
        }

        html = render_to_string("transcription/pdf.html", context)
        pdf_bytes = HTML(string=html).write_pdf()
        pdf_file = io.BytesIO(pdf_bytes)

        file_name = f"transcript-{job.consultation_id}.pdf"
        return FileResponse(pdf_file, as_attachment=True, filename=file_name, content_type="application/pdf")
