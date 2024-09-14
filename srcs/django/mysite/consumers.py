from channels.generic.websocket import AsyncWebsocketConsumer
import json

class VotreConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(json.dumps({'message': 'Connexion établie'}))

    async def disconnect(self, close_code):
        print('Déconnexion')

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Traitez les données reçues ici
        await self.send(json.dumps({'message': 'Message reçu'}))
