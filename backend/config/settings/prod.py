"""
Production settings for Nena na Daktari.
Extends base settings with production-specific configuration.
"""

import os

from .base import *  # noqa: F401, F403

# Production should never have DEBUG on
DEBUG = False

# Read database URL from environment (Render provides this)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DATABASE_URL", "").split("/")[-1]
        if os.environ.get("DATABASE_URL")
        else config("DB_NAME", default="nnd_db"),
        "USER": os.environ.get("DATABASE_URL", "").split("//")[1].split(":")[0]
        if os.environ.get("DATABASE_URL")
        else config("DB_USER", default="nnd_user"),
        "PASSWORD": os.environ.get("DATABASE_URL", "").split(":")[2].split("@")[0]
        if os.environ.get("DATABASE_URL")
        else config("DB_PASSWORD", default="nnd_password"),
        "HOST": os.environ.get("DATABASE_URL", "").split("@")[1].split(":")[0]
        if os.environ.get("DATABASE_URL")
        else config("DB_HOST", default="localhost"),
        "PORT": os.environ.get("DATABASE_URL", "").split(":")[-1].split("/")[0]
        if os.environ.get("DATABASE_URL")
        else config("DB_PORT", default="5432"),
    }
}

# Security settings (already in base, but explicit here)
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# CORS - only allow production frontend
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="https://your-vercel-app.vercel.app",
    cast=lambda v: [s.strip() for s in v.split(",")],
)

# Sentry for error tracking (optional)
SENTRY_DSN = config("SENTRY_DSN", default=None)
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=True,
    )

print("Loaded production settings")  # noqa: T201
