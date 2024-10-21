import json
from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import asyncio
import math
from mysite.models.game import Game, PlayerGameLink
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async

User = get_user_model()

# Constants
SCREEN_WIDTH = 600
SCREEN_HEIGHT = 400
FPS = 60
MAX_PLAYERS_PER_ROOM = 2

BALL_INITIAL_X = SCREEN_WIDTH / 2
BALL_INITIAL_Y = SCREEN_HEIGHT / 2
BALL_RADIUS = 10
BALL_INITIAL_SPEED = 2
BALL_SPEED_INCREMENT = 0.2
BALL_MAX_SPEED = 10
BALL_RESET_SPEED = 2

PADDLE_WIDTH = 20
PADDLE_HEIGHT = 100
PADDLE_INITIAL_Y = 250

SCORE_TO_WIN = 2

UPDATE_INTERVAL = 1

connected_players = {}
rooms = {}

class PongConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.player_id = self.scope['user'].id
        self.user = self.scope['user']

        if self.player_id in connected_players:
            await self.close()
            return

        connected_players[self.player_id] = self.channel_name

        room_found = False
        for room_name, room_data in rooms.items():
            if len(room_data['players']) < MAX_PLAYERS_PER_ROOM:
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
                        'x': BALL_INITIAL_X,
                        'y': BALL_INITIAL_Y,
                        'radius': BALL_RADIUS,
                        'speed': BALL_INITIAL_SPEED,
                        'velocityX': BALL_INITIAL_SPEED,
                        'velocityY': BALL_INITIAL_SPEED
                    },
                    'paddles': {
                        'left': {'y': PADDLE_INITIAL_Y},
                        'right': {'y': PADDLE_INITIAL_Y}
                    },
                    'scores': {
                        'left': 0,
                        'right': 0
                    }
                }
            }

            # Create a new Game instance asynchronously
            game = await database_sync_to_async(Game.objects.create)()
            rooms[self.room_group_name]['game'] = game

        await self.accept()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # Après avoir récupéré ou créé le jeu
        if len(rooms[self.room_group_name]['players']) == MAX_PLAYERS_PER_ROOM:
          game = rooms[self.room_group_name]['game']  # Récupère le jeu à partir du dictionnaire
          players = rooms[self.room_group_name]['players']

          # Assigner les équipes et créer les liens joueurs-jeu
          for i, player_info in enumerate(players):
              team = 1 if i == 0 else 2
              user = await database_sync_to_async(User.objects.get)(id=player_info['player_id'])

              link, created = await database_sync_to_async(PlayerGameLink.objects.get_or_create)(
                  player=user,
                  game=game,
                  defaults={'team': team}
              )

              if created:
                  print(f"Le joueur {user} a été associé à la partie {game} avec l'équipe {team}.")
              else:
                  print(f"Le joueur {user} est déjà associé à la partie {game}.")

          # Démarrer la partie
          await self.channel_layer.group_send(
              self.room_group_name,
              {
                  'type': 'start_game',
                  'message': 'La partie commence!',
                  'player_left_channel': players[0]['channel_name'],
                  'player_right_channel': players[1]['channel_name']
              }
          )



    async def disconnect(self, close_code):
        if self.room_group_name in rooms:
            players = rooms[self.room_group_name]['players']
            rooms[self.room_group_name]['players'] = [p for p in players if p['channel_name'] != self.channel_name]

            if len(rooms[self.room_group_name]['players']) == 0:
                del rooms[self.room_group_name]
            else:
                remaining_player = rooms[self.room_group_name]['players'][0]
                game = rooms[self.room_group_name]['game']
                user = await database_sync_to_async(User.objects.get)(id=remaining_player['player_id'])

                # Vérifier si le PlayerGameLink existe
                try:
                    winner_link = await database_sync_to_async(PlayerGameLink.objects.get)(player=user, game=game)
                except PlayerGameLink.DoesNotExist:
                    # Créer le lien s'il n'existe pas
                    winner_link = await database_sync_to_async(PlayerGameLink.objects.create)(
                        player=user,
                        game=game,
                        team=1  # Ou l'équipe appropriée
                    )

                winner_link.is_winner = True
                winner_link.reason = "L'autre joueur a quitté la partie."
                await database_sync_to_async(winner_link.save)()

                game.is_active = False
                await database_sync_to_async(game.save)()

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

        # Start the game loop
        asyncio.create_task(self.game_loop())

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'input':
            if self.room_group_name in rooms:
                game_state = rooms[self.room_group_name]['game_state']
                if self.channel_name == rooms[self.room_group_name]['players'][0]['channel_name']:
                    # Left player
                    game_state['paddles']['left']['y'] = data['paddleY']
                else:
                    # Right player
                    game_state['paddles']['right']['y'] = data['paddleY']

    async def game_loop(self):
        update_counter = 0
        while True:
            await asyncio.sleep(1 / FPS)  # FPS

            if self.room_group_name in rooms:
                game_state = rooms[self.room_group_name]['game_state']

                ball = game_state['ball']
                paddles = game_state['paddles']
                scores = game_state['scores']

                # Update ball position
                ball['x'] += ball['velocityX']
                ball['y'] += ball['velocityY']

                # Collisions with walls
                if ball['y'] - ball['radius'] < 0:
                    ball['y'] = ball['radius']
                    ball['velocityY'] = -ball['velocityY']
                elif ball['y'] + ball['radius'] > SCREEN_HEIGHT:
                    ball['y'] = SCREEN_HEIGHT - ball['radius']
                    ball['velocityY'] = -ball['velocityY']

                # Check if a point is scored
                if ball['x'] - ball['radius'] < 0:
                    scores['right'] += 1
                    await self.update_score('right')
                    await self.reset_ball(ball)
                elif ball['x'] + ball['radius'] > SCREEN_WIDTH:
                    scores['left'] += 1
                    await self.update_score('left')
                    await self.reset_ball(ball)

                # Collisions with paddles
                paddle_left = {'x': 0, 'y': paddles['left']['y'], 'width': PADDLE_WIDTH, 'height': PADDLE_HEIGHT}
                paddle_right = {'x': SCREEN_WIDTH - PADDLE_WIDTH, 'y': paddles['right']['y'], 'width': PADDLE_WIDTH, 'height': PADDLE_HEIGHT}

                if self.check_collision(ball, paddle_left):
                    ball['x'] = paddle_left['x'] + paddle_left['width'] + ball['radius']
                    self.reflect_ball(ball, paddle_left)
                elif self.check_collision(ball, paddle_right):
                    ball['x'] = paddle_right['x'] - ball['radius']
                    self.reflect_ball(ball, paddle_right)

                # Send updates every UPDATE_INTERVAL iterations
                update_counter += 1
                if update_counter % UPDATE_INTERVAL == 0:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_update',
                            'game_state': game_state  # Send the game state
                        }
                    )
            else:
                break

    async def update_score(self, scoring_team):
      """Update the score of the respective team and check if the game is won."""
      game = rooms[self.room_group_name]['game']
      
      # Récupérer les liens pour les deux joueurs
      left_player_link = await database_sync_to_async(PlayerGameLink.objects.get)(game=game, team=1)
      right_player_link = await database_sync_to_async(PlayerGameLink.objects.get)(game=game, team=2)

      # Mettre à jour le score de l'équipe qui a marqué
      if scoring_team == 'left':
          left_player_link.score += 1
          await database_sync_to_async(left_player_link.save)()
      else:
          right_player_link.score += 1
          await database_sync_to_async(right_player_link.save)()

      # Vérifier si l'un des deux joueurs a gagné
      if left_player_link.score >= SCORE_TO_WIN or right_player_link.score >= SCORE_TO_WIN:
          await self.end_game(left_player_link if left_player_link.score >= SCORE_TO_WIN else right_player_link)



    async def end_game(self, winner_link):
      """End the game, mark the winner, and close the game."""
      game = winner_link.game
      winner_link.is_winner = True
      winner_link.reason = "A atteint le score maximum."
      await database_sync_to_async(winner_link.save)()

      game.is_active = False
      await database_sync_to_async(game.save)()


    def check_collision(self, ball, paddle):
        return (
            ball['x'] - ball['radius'] < paddle['x'] + paddle['width'] and
            ball['x'] + ball['radius'] > paddle['x'] and
            ball['y'] + ball['radius'] > paddle['y'] and
            ball['y'] - ball['radius'] < paddle['y'] + paddle['height']
        )

    def reflect_ball(self, ball, paddle):
        collide_point = (ball['y'] - (paddle['y'] + paddle['height'] / 2)) / (paddle['height'] / 2)
        angle_rad = (math.pi / 4) * collide_point

        direction = 1 if ball['x'] < SCREEN_WIDTH / 2 else -1
        ball['velocityX'] = direction * ball['speed'] * math.cos(angle_rad)
        ball['velocityY'] = ball['speed'] * math.sin(angle_rad)

        ball['speed'] += BALL_SPEED_INCREMENT
        if ball['speed'] >= BALL_MAX_SPEED:
            ball['speed'] = BALL_MAX_SPEED

    async def reset_ball(self, ball):
        ball['x'] = BALL_INITIAL_X
        ball['y'] = BALL_INITIAL_Y
        ball['speed'] = BALL_RESET_SPEED
        ball['velocityX'] = ball['speed'] * (-1 if ball['velocityX'] > 0 else 1)
        ball['velocityY'] = 0

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
