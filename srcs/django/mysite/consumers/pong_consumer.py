
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Chaque client est ajouté à une salle d'attente (room) en attendant un autre joueur
        self.room_group_name = "waiting_room"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # Accepter la connexion WebSocket
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_message',
                'message': 'Envoyer a tous le monde '
            }
        )

        # Vous pouvez envoyer un message de bienvenue
        await self.send(text_data=json.dumps({
            'message': 'Connexion établie. En attente d’un autre joueur...'
        }))

    async def disconnect(self, close_code):
        # Déconnexion du joueur
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        # Gérer les messages reçus du client (par exemple, les mouvements de la raquette)
        data = json.loads(text_data)
        action = data.get('action')

        # Traiter l'action (ex : 'move_paddle', 'start_game', etc.)
        if action == 'move_paddle':
            # Gérer le mouvement de la raquette
            pass
        elif action == 'start_game':
            # Démarrer la partie
            pass

        # Répondre au client avec une mise à jour
        await self.send(text_data=json.dumps({
            'message': 'Action reçue : ' + action
        }))

    async def game_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))