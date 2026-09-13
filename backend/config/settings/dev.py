"""
Development settings for Nena na Daktari.
Extends base settings with development-specific configuration.
"""

from .base import *  # noqa: F401, F403

# CORS - allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Email backend for development (console output)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Disable HTTPS redirects in development
SECURE_SSL_REDIRECT = False

# Debug toolbar (optional - install with: pip install django-debug-toolbar)
try:
    import debug_toolbar  # noqa: F401

    INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
    MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405
    INTERNAL_IPS = ["127.0.0.1", "localhost"]
except ImportError:
    pass

print("Loaded development settings")  # noqa: T201
