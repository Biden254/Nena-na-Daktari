"""
WSGI config for Nena na Daktari project.
"""

import os

from django.core.wsgi import get_wsgi_application

# Use production settings by default for Render deployment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_wsgi_application()
