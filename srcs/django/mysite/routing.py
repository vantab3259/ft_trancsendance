# routing.py
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'ws/pong/$', 'mysite.consumers.pong_consumer.PongConsumer.as_asgi()'),
    re_path(r'ws/pong/$', 'mysite.consumers.chat_consumer.ChatConsumer.as_asgi()'),
    re_path(r'ws/game/tournament/(?P<match_id>\d+)/$', 'mysite.consumers.tournament_pong_consumer.TournamentPongConsumer.as_asgi()'),
    
]
