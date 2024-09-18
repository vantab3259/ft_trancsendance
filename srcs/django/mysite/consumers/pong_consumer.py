
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accepter la connexion WebSocket
        await self.accept()

        # Assignation à une room
        self.room_group_name = await self.assign_room()

        # Ajouter le client au groupe de la room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Envoyer un message indiquant que la connexion est établie
        await self.send(text_data=json.dumps({
            'message': 'Connexion établie. En attente d’un autre joueur...'
        }))

    async def disconnect(self, close_code):
        # Retirer le client du groupe de la room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Si le joueur quitte avant que la room soit complète, libérer la room
        await self.remove_player_from_room(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        # Parse the incoming message
        data = json.loads(text_data)
        message = data['message']
        username = data['username']
        date = data['date']

        # Broadcast the message to the room, including the sender's channel_name
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username,
                'date': date,
                'code': 4001,
                'userImage': "https://www.w3schools.com/howto/img_avatar.png",  # Image par défaut
                'sender_channel_name': self.channel_name  # Inclure l'identifiant du canal de l'émetteur
            }
        )

    # Function to handle messages
    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        date = event['date']
        userImage = event['userImage']
        sender_channel_name = event['sender_channel_name']

        # Ne pas envoyer le message à l'utilisateur qui l'a envoyé
        if self.channel_name != sender_channel_name:
            # Send the message to WebSocket clients
            await self.send(text_data=json.dumps({
                'code': 4001,
                'message': message,
                'username': username,
                'date': date,
                'userImage': userImage
            }))

    async def game_message(self, event):
        # Envoyer le message au WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    @database_sync_to_async
    def assign_room_sync(self):
        # Récupérer la liste des rooms en attente
        waiting_rooms = cache.get('waiting_rooms', [])

        if waiting_rooms:
            # S'il y a une room en attente, l'assigner à cette room
            room = waiting_rooms.pop(0)
            cache.set('waiting_rooms', waiting_rooms)
            return room
        else:
            # Sinon, créer une nouvelle room
            import uuid
            room = f"room_{uuid.uuid4().hex}"
            return room

    async def assign_room(self):
        room = await self.assign_room_sync()
        # Vérifier si la room est déjà occupée par un joueur
        players = cache.get(room, [])
        players.append(self.channel_name)
        cache.set(room, players)

        await self.channel_layer.group_add(room, self.channel_name)

        if len(players) == 2:
            # Si deux joueurs sont dans la room, les informer que la partie peut commencer
            await self.channel_layer.group_send(
                room,
                {
                    'type': 'start_game',
                    'message': 'Deux joueurs sont prêts. La partie commence!',
                }
            )
        else:
            # Sinon, ajouter la room aux rooms en attente
            waiting_rooms = cache.get('waiting_rooms', [])
            waiting_rooms.append(room)
            cache.set('waiting_rooms', waiting_rooms)

        return room

    @database_sync_to_async
    def remove_player_from_room(self, room, channel_name):
        players = cache.get(room, [])
        if channel_name in players:
            players.remove(channel_name)
            cache.set(room, players)

            if len(players) == 1:
                # Si un joueur reste, remettre la room dans les rooms en attente
                waiting_rooms = cache.get('waiting_rooms', [])
                waiting_rooms.append(room)
                cache.set('waiting_rooms', waiting_rooms)

    async def start_game(self, event):
        # Envoyer le message de début de partie à tous les clients dans la room
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'code': 4000
        }))