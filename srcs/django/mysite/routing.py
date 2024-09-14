from django.urls import re_path
from mysite.consumers.pong_consumer import PongConsumer


websocket_urlpatterns = [
    re_path(r'ws/pong/$', PongConsumer.as_asgi()),
]
