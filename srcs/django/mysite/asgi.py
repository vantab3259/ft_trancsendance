# asgi.py

import os
import django
from django.core.asgi import get_asgi_application  # Ajoute cette ligne
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()  # Initialise Django

from mysite.consumers.pong_consumer import PongConsumer  # Importer après django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            re_path(r'ws/pong/$', PongConsumer.as_asgi()),
        ])
    ),
})


