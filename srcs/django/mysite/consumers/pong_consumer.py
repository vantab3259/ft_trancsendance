# pong_consumer.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
import uuid

class PongConsumer(AsyncWebsocketConsumer):
    # Connexion au WebSocket
    async def connect(self):
        await self.accept()
        self.room_group_name = f"room_{uuid.uuid4().hex}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

    # Déconnexion
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Gestion du début de la partie
    async def start_game(self, event):
        await self.send(text_data=json.dumps({
            'message': 'La partie commence!',
        }))
