
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
import datetime
from django.utils import timezone



class PongConsumer(AsyncWebsocketConsumer):
    
    # se connecter au serveur
    async def connect(self):
      await self.accept()

      user = self.scope["user"]
      if user.is_authenticated:
          # Stocke le `channel_name` dans le cache avec l'ID utilisateur comme clé
          cache.set(f"user_channel_{user.id}", self.channel_name)

      self.room_group_name = await self.assign_room()

      await self.channel_layer.group_add(
          self.room_group_name,
          self.channel_name
      )

      await self.send(text_data=json.dumps({
          'message': 'Connexion établie. En attente d’un autre joueur...'
      }))


    # se déconnecter du serveur
    async def disconnect(self, close_code):
      user = self.scope["user"]
      if user.is_authenticated:
          # Supprime le `channel_name` de l'utilisateur du cache
          cache.delete(f"user_channel_{user.id}")

      await self.channel_layer.group_discard(
          self.room_group_name,
          self.channel_name
      )

      await self.remove_player_from_room(self.room_group_name, self.channel_name)


    from channels.exceptions import DenyConnection

    # recevoir un message du serveur
    # recevoir un message du serveur
    async def receive(self, text_data):
        from mysite.models.chat import ChatMessage
        from django.contrib.auth import get_user_model
        User = get_user_model()

        data = json.loads(text_data)
        message = data['message']
        recipient_id = data.get('recipient_id')  # Récupère l'ID du destinataire

        sender = self.scope["user"]
        date = timezone.now()

        if not sender.is_authenticated:
            await self.send(text_data=json.dumps({
                'message': 'Vous devez être connecté pour envoyer des messages.'
            }))
            return

        try:
            # Vérifie si le destinataire existe
            recipient = await database_sync_to_async(User.objects.get)(id=recipient_id)
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({
                'message': 'Destinataire introuvable.'
            }))
            return

        # Enregistre le message dans la base de données
        await self.save_message(sender, recipient, message)

        # Récupère le `channel_name` du destinataire depuis le cache
        recipient_channel_name = cache.get(f"user_channel_{recipient_id}")

        if recipient_channel_name:
            # Le destinataire est en ligne, envoyer le message via WebSocket
            await self.channel_layer.send(
                recipient_channel_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': sender.get_short_name(),
                    'date': date.strftime('%Y-%m-%d %H:%M:%S'),
                    'userImage': sender.get_profile_picture_url(),
                    'sender_channel_name': self.channel_name
                }
            )
        else:
            # Le destinataire est hors ligne, notifier l'expéditeur que le message a été enregistré
            await self.send(text_data=json.dumps({
                'message': 'Message envoyé et enregistré en base de données. Le destinataire est actuellement hors ligne.'
            }))




    # Traiter un message envoyé dans le groupe
    async def chat_message(self, event):
      message = event['message']
      username = event['username']
      date = event['date']
      userImage = event['userImage']
      sender_channel_name = event.get('sender_channel_name')

      # Vérifie si le message n'est pas envoyé au même utilisateur
      if self.channel_name != sender_channel_name:
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
    def save_message(self, sender, recipient, message):
        """Enregistrer le message en base de données."""
        from mysite.models.chat import ChatMessage 
        return ChatMessage.objects.create(
            sender=sender,
            recipient=recipient,
            message=message,
            timestamp=timezone.now()
        )

    @database_sync_to_async
    def get_recipient(self, username):
        """Récupérer l'utilisateur destinataire à partir de son nom d'utilisateur."""
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

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