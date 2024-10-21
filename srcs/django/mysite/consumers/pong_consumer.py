import json
from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import asyncio
import math
connected_players = {}
rooms = {}

class PongConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.player_id = self.scope["session"].session_key

        if self.player_id in connected_players:
            await self.close()
            return

        connected_players[self.player_id] = self.channel_name

        room_found = False
        for room_name, room_data in rooms.items():
            if len(room_data['players']) < 2:
                self.room_group_name = room_name
                room_data['players'].append({'player_id': self.player_id, 'channel_name': self.channel_name})
                room_found = True
                break

        if not room_found:
            self.room_group_name = f"room_{uuid.uuid4().hex}"
            rooms[self.room_group_name] = {
                'players': [{'player_id': self.player_id, 'channel_name': self.channel_name}],
                'game_state': {
                    'ball': {
                        'x': 300,
                        'y': 200,
                        'radius': 10,
                        'speed': 4,       # Vitesse initiale réduite
                        'velocityX': 4,   # Vitesse horizontale initiale réduite
                        'velocityY': 4    # Vitesse verticale initiale réduite
                    },
                    'paddles': {
                        'left': {'y': 250},
                        'right': {'y': 250}
                    },
                    'scores': {
                        'left': 0,
                        'right': 0
                    }
                }
            }

        await self.accept()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        if len(rooms[self.room_group_name]['players']) == 2:
            players = rooms[self.room_group_name]['players']
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'start_game',
                    'message': 'La partie commence!',
                    'player_left_channel': players[0]['channel_name'],
                    'player_right_channel': players[1]['channel_name']
                }
            )

    async def start_game(self, event):
        if self.channel_name == event['player_left_channel']:
            await self.send(text_data=json.dumps({
                'message': event['message'],
                'type': 'player_position',
                'isPlayerLeft': True
            }))
        else:
            await self.send(text_data=json.dumps({
                'message': event['message'],
                'type': 'player_position',
                'isPlayerLeft': False
            }))

        # Démarrer la boucle de jeu
        asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        if self.room_group_name in rooms:
            players = rooms[self.room_group_name]['players']
            rooms[self.room_group_name]['players'] = [p for p in players if p['channel_name'] != self.channel_name]
            if len(rooms[self.room_group_name]['players']) == 0:
                del rooms[self.room_group_name]

        if self.player_id in connected_players:
            del connected_players[self.player_id]

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        if self.room_group_name in rooms and len(rooms[self.room_group_name]['players']) == 1:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_left',
                    'message': 'L\'autre joueur a quitté la partie.',
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'input':
            if self.room_group_name in rooms:
                game_state = rooms[self.room_group_name]['game_state']
                if self.channel_name == rooms[self.room_group_name]['players'][0]['channel_name']:
                    # Joueur gauche
                    game_state['paddles']['left']['y'] = data['paddleY']
                else:
                    # Joueur droit
                    game_state['paddles']['right']['y'] = data['paddleY']

    async def game_loop(self):
      update_counter = 0
      while True:
          await asyncio.sleep(1/60)  # 60 FPS

          if self.room_group_name in rooms:
              game_state = rooms[self.room_group_name]['game_state']

              ball = game_state['ball']
              paddles = game_state['paddles']
              scores = game_state['scores']

              # Mise à jour de la position de la balle
              ball['x'] += ball['velocityX']
              ball['y'] += ball['velocityY']

              # Collisions avec les murs
              if ball['y'] - ball['radius'] < 0:
                  ball['y'] = ball['radius']
                  ball['velocityY'] = -ball['velocityY']
              elif ball['y'] + ball['radius'] > 400:
                  ball['y'] = 400 - ball['radius']
                  ball['velocityY'] = -ball['velocityY']

              # Vérifier si un point est marqué
              if ball['x'] - ball['radius'] < 0:
                  scores['right'] += 1
                  await self.reset_ball(ball)
              elif ball['x'] + ball['radius'] > 600:
                  scores['left'] += 1
                  await self.reset_ball(ball)

              # Collisions avec les paddles
              paddle_left = {'x': 0, 'y': paddles['left']['y'], 'width': 20, 'height': 100}
              paddle_right = {'x': 600 - 20, 'y': paddles['right']['y'], 'width': 20, 'height': 100}

              if self.check_collision(ball, paddle_left):
                  ball['x'] = paddle_left['x'] + paddle_left['width'] + ball['radius']
                  self.reflect_ball(ball, paddle_left)
              elif self.check_collision(ball, paddle_right):
                  ball['x'] = paddle_right['x'] - ball['radius']
                  self.reflect_ball(ball, paddle_right)

              # Envoie les mises à jour seulement toutes les 5 itérations (1/12 secondes environ)
              update_counter += 1
              if update_counter % 5 == 0 or 1:
                  await self.channel_layer.group_send(
                      self.room_group_name,
                      {
                          'type': 'game_update',
                          'game_state': game_state  # Envoie l'état du jeu
                      }
                  )
          else:
              break


    def check_collision(self, ball, paddle):
        # Vérifier la collision entre la balle et un paddle
        return (
            ball['x'] - ball['radius'] < paddle['x'] + paddle['width'] and
            ball['x'] + ball['radius'] > paddle['x'] and
            ball['y'] + ball['radius'] > paddle['y'] and
            ball['y'] - ball['radius'] < paddle['y'] + paddle['height']
        )

    def reflect_ball(self, ball, paddle):
        # Calcule le point de collision
        collide_point = (ball['y'] - (paddle['y'] + paddle['height'] / 2)) / (paddle['height'] / 2)
        angle_rad = (math.pi / 4) * collide_point  # Utilise math.pi pour plus de précision

        # Change la direction de la balle
        direction = 1 if ball['x'] < 300 else -1  # Canvas de largeur 600, donc le milieu est à 300
        ball['velocityX'] = direction * ball['speed'] * math.cos(angle_rad)
        ball['velocityY'] = ball['speed'] * math.sin(angle_rad)

        # Augmente la vitesse de la balle plus lentement
        ball['speed'] += 0.2  # Incrément réduit
        if ball['speed'] >= 10:  # Vitesse maximale réduite
            ball['speed'] = 10


    async def reset_ball(self, ball):
        # Réinitialise la balle au centre avec une vitesse initiale réduite
        ball['x'] = 300
        ball['y'] = 200
        ball['speed'] = 2  # Vitesse initiale réduite
        angle_rad = 0  # Angle initial pour un mouvement horizontal
        ball['velocityX'] = ball['speed'] * math.cos(angle_rad) * (-1 if ball['velocityX'] > 0 else 1)
        ball['velocityY'] = ball['speed'] * math.sin(angle_rad)

    async def game_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'playerLeftPaddleY': event['game_state']['paddles']['left']['y'],
            'playerRightPaddleY': event['game_state']['paddles']['right']['y'],
            'ballX': event['game_state']['ball']['x'],
            'ballY': event['game_state']['ball']['y'],
            'leftScore': event['game_state']['scores']['left'],
            'rightScore': event['game_state']['scores']['right']
        }))

    async def player_left(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))
