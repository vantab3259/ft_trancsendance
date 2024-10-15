# routing.py
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'ws/pong/$', 'mysite.consumers.pong_consumer.PongConsumer.as_asgi()'),
]
