import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model
import uuid 


User = get_user_model()


class PongConsumer(AsyncWebsocketConsumer):

    # Connect the user and set up room
    async def connect(self):
        await self.accept()
        user = self.scope["user"]
        if user.is_authenticated:
            cache.set(f"user_channel_{user.id}", self.channel_name)
        self.room_group_name = await self.assign_room()
        await self.join_room_group()
        await self.notify_connection()

    # Disconnect the user and clean up
    async def disconnect(self, close_code):
        user = self.scope["user"]
        if user.is_authenticated:
            cache.delete(f"user_channel_{user.id}")
        await self.leave_room_group()
        await self.remove_player_from_room(self.room_group_name, self.channel_name)

    # Receive message from user and process it
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        recipient_id = data.get('recipient_id')
        sender = self.scope["user"]

        if not sender.is_authenticated:
            await self.send_authentication_error()
            return

        recipient = await self.get_user_by_id(recipient_id)
        if not recipient:
            await self.send_recipient_not_found()
            return

        await self.save_message(sender, recipient, message)
        recipient_channel_name = cache.get(f"user_channel_{recipient_id}")
        
        if recipient_channel_name:
            await self.send_to_recipient(recipient_channel_name, sender, message)
        else:
            await self.send_recipient_offline_notification()

    # Send message to recipient if they are online
    async def send_to_recipient(self, recipient_channel_name, sender, message):
        await self.channel_layer.send(
            recipient_channel_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': sender.get_short_name(),
                'date': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'userImage': sender.get_profile_picture_url(),
                'sender_channel_name': self.channel_name
            }
        )

    # Notify sender that the recipient is offline
    async def send_recipient_offline_notification(self):
        await self.send(text_data=json.dumps({
            'message': 'Message envoyé et enregistré en base de données. Le destinataire est actuellement hors ligne.'
        }))

    # Notify sender if they are not authenticated
    async def send_authentication_error(self):
        await self.send(text_data=json.dumps({
            'message': 'Vous devez être connecté pour envoyer des messages.'
        }))

    # Notify sender if recipient is not found
    async def send_recipient_not_found(self):
        await self.send(text_data=json.dumps({
            'message': 'Destinataire introuvable.'
        }))

    # Add user to the room group
    async def join_room_group(self):
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

    # Remove user from the room group
    async def leave_room_group(self):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Notify user of connection status
    async def notify_connection(self):
        await self.send(text_data=json.dumps({
            'message': 'Connexion établie. En attente d’un autre joueur...'
        }))

    # Handle chat messages within the group
    async def chat_message(self, event):
        if self.channel_name != event.get('sender_channel_name'):
            await self.send(text_data=json.dumps({
                'code': 4001,
                'message': event['message'],
                'username': event['username'],
                'date': event['date'],
                'userImage': event['userImage']
            }))

    # Save message to the database
    @database_sync_to_async
    def save_message(self, sender, recipient, message):
        from mysite.models.chat import ChatMessage
        return ChatMessage.objects.create(
            sender=sender,
            recipient=recipient,
            message=message,
            timestamp=timezone.now()
        )

    # Get user by ID
    @database_sync_to_async
    def get_user_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    # Assign room to the user
    @database_sync_to_async
    def assign_room_sync(self):
        waiting_rooms = cache.get('waiting_rooms', [])
        if waiting_rooms:
            room = waiting_rooms.pop(0)
            cache.set('waiting_rooms', waiting_rooms)
            return room
        else:
            room = f"room_{uuid.uuid4().hex}"
            return room

    async def assign_room(self):
        # Assigner un nom unique de room
        room = await self.assign_room_sync()
        
        # Ajouter le canal de l'utilisateur au groupe de la room
        players = cache.get(room, [])
        players.append(self.channel_name)
        cache.set(room, players)

        # Définir le nom du groupe de room
        self.room_group_name = room

        await self.channel_layer.group_add(room, self.channel_name)

        if len(players) == 2:
            # Si deux joueurs sont dans la room, les informer que la partie peut commencer
            await self.start_game()
        else:
            # Sinon, ajouter la room aux rooms en attente
            waiting_rooms = cache.get('waiting_rooms', [])
            waiting_rooms.append(room)
            cache.set('waiting_rooms', waiting_rooms)

        return room

    # Fonction pour gérer les messages de début de partie
    async def game_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'code': event.get('code', 4000)
        }))

    async def start_game(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_message',  # Correspond au nom de la fonction game_message
                'message': 'Deux joueurs sont prêts. La partie commence!',
                'code': 4000
            }
        )





    # Remove player from room
    @database_sync_to_async
    def remove_player_from_room(self, room, channel_name):
        players = cache.get(room, [])
        if channel_name in players:
            players.remove(channel_name)
            cache.set(room, players)
            if len(players) == 1:
                waiting_rooms = cache.get('waiting_rooms', [])
                waiting_rooms.append(room)
                cache.set('waiting_rooms', waiting_rooms)
