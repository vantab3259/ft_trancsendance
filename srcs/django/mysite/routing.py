# routing.py
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<map_type>.+)/$', 'mysite.consumers.pong_consumer.PongConsumer.as_asgi()'),
    re_path(r'ws/pong/$', 'mysite.consumers.chat_consumer.ChatConsumer.as_asgi()'),
    re_path(r'ws/tournament/match/(?P<match_id>\d+)/$', 'mysite.consumers.tournament_consumer.TournamentConsumer.as_asgi()'),
]
