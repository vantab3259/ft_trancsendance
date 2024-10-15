# chat_consumer.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from django.utils import timezone
from mysite.models.chat import ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    # Connexion au WebSocket
    async def connect(self):
        await self.accept()
        user = self.scope["user"]
        if user.is_authenticated:
            cache.set(f"user_channel_{user.id}", self.channel_name)

    # Déconnexion
    async def disconnect(self, close_code):
        user = self.scope["user"]
        if user.is_authenticated:
            cache.delete(f"user_channel_{user.id}")

    # Recevoir et traiter un message
    async def receive(self, text_data):
        data = self.parse_message_data(text_data)
        sender = self.scope["user"]
        
        if sender.is_authenticated:
            recipient = await self.get_recipient(data['recipient_id'])
            if recipient:
                await self.process_message(sender, recipient, data['message'])

    # Parse les données JSON du message
    def parse_message_data(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        recipient_id = data.get('recipient_id')
        return {'message': message, 'recipient_id': recipient_id}

    # Récupère l'utilisateur destinataire depuis la base de données
    async def get_recipient(self, recipient_id):
        try:
            recipient = await database_sync_to_async(User.objects.get)(id=recipient_id)
            return recipient
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({
                'message': 'Destinataire introuvable.'
            }))
            return None

    # Enregistre le message et l'envoie au destinataire s'il est en ligne
    async def process_message(self, sender, recipient, message):
        await self.save_message(sender, recipient, message)
        recipient_channel_name = cache.get(f"user_channel_{recipient.id}")

        if recipient_channel_name:
            await self.send_message_to_recipient(sender, message, recipient_channel_name)

    # Enregistre le message en base de données
    @database_sync_to_async
    def save_message(self, sender, recipient, message):
        return ChatMessage.objects.create(
            sender=sender,
            recipient=recipient,
            message=message,
            timestamp=timezone.now()
        )

    # Envoie le message au destinataire via le WebSocket
    async def send_message_to_recipient(self, sender, message, recipient_channel_name):
        date = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        await self.channel_layer.send(
            recipient_channel_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': sender.get_short_name(),
                'date': date,
                'userImage': sender.get_profile_picture_url(),
            }
        )

    # Enregistrer le message en base de données
    @database_sync_to_async
    def save_message(self, sender, recipient, message):
        return ChatMessage.objects.create(
            sender=sender,
            recipient=recipient,
            message=message,
            timestamp=timezone.now()
        )

    # Gérer le message de chat reçu
    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        date = event['date']
        userImage = event['userImage']
        
        await self.send(text_data=json.dumps({
            'code': 4001,
            'message': message,
            'username': username,
            'date': date,
            'userImage': userImage
        }))
