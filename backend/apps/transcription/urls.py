from django.urls import path

from . import views

app_name = "transcription"

urlpatterns = [
    path("consultations/<uuid:consultation_id>/audio/", views.AudioUploadView.as_view(), name="audio-upload"),
    path("jobs/<uuid:job_id>/", views.TranscriptionJobStatusView.as_view(), name="job-status"),
    path("jobs/<uuid:job_id>/pdf/", views.TranscriptionPDFView.as_view(), name="job-pdf"),
]
