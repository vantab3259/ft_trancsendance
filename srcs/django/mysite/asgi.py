# asgi.py

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()  # Initialise Django

from mysite.consumers.pong_consumer import PongConsumer
from mysite.consumers.chat_consumer import ChatConsumer
from mysite.consumers.tournament_consumer import TournamentConsumer
from mysite.consumers.uservs_consumer import UservsConsumer

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            re_path(r'ws/pong/(?P<map_type>.+)/$', PongConsumer.as_asgi()),
            re_path(r'ws/chat/$', ChatConsumer.as_asgi()),
            re_path(r'^ws/tournament/match/(?P<match_id>\d+)/$', TournamentConsumer.as_asgi()),
            re_path(r'ws/uservs/(?P<map_type>.+)/(?P<user_id>\d+)/$', UservsConsumer.as_asgi()),
        ])
    ),
})


