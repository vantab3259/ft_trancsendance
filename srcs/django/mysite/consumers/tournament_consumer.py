import json
from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import asyncio
import math
from mysite.models.game import Game, PlayerGameLink
from mysite.models.tournament import TournamentMatch, TournamentRound
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import random
import logging
from django.db import transaction
from django.utils import timezone


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

SQUARE_WIDTH = 50
SQUARE_HEIGHT = 50

SQUARE1_X = SCREEN_WIDTH / 2 + 55
SQUARE1_Y = SCREEN_HEIGHT / 2 - 25

SQUARE2_X = SCREEN_WIDTH / 2 - 105
SQUARE2_Y = SCREEN_HEIGHT / 2 - 25





connected_players = {}
rooms = {}



def advance_tournament_round(tournament):
    """Advances the tournament to the next round or ends it."""
    current_round = tournament.rounds.last()

    if current_round.matches.filter(is_complete=False).exists():
        logging.info(f"Round {current_round.round_number} is not yet complete.")
        return

    winners = [match.winner for match in current_round.matches.all() if match.winner]
    logging.info(f"Winners from Round {current_round.round_number}: {[w.id for w in winners]}")

    if len(winners) == 1:
        tournament.is_active = False
        tournament.date_finished = timezone.now()
        tournament.save()
        logging.info(f"Tournament {tournament.name} completed. Winner: {winners[0].id}")
        return

    if len(winners) == 2:
        next_round = TournamentRound.objects.create(
            tournament=tournament,
            round_number=current_round.round_number + 1
        )
        game = Game.objects.create()
        TournamentMatch.objects.create(
            tournament_round=next_round,
            player1=winners[0],
            player2=winners[1],
            game=game
        )
        logging.info(f"Next round {next_round.round_number} initialized for Tournament {tournament.name}.")
    else:
        raise ValueError(f"Unexpected number of winners: {len(winners)}")

class TournamentConsumer(AsyncWebsocketConsumer):

    def ball_square_collision(self, ball, square):
        closest_x = max(square['x'], min(ball['x'], square['x'] + square['width']))
        closest_y = max(square['y'], min(ball['y'], square['y'] + square['height']))

        distance_x = ball['x'] - closest_x
        distance_y = ball['y'] - closest_y

        distance_squared = distance_x ** 2 + distance_y ** 2

        return distance_squared < (ball['radius'] ** 2)

    def get_collision_point(self, ball, square):
        closest_x = max(square['x'], min(ball['x'], square['x'] + square['width']))
        closest_y = max(square['y'], min(ball['y'], square['y'] + square['height']))

        if closest_y == ball['y']:
            return 'left' if closest_x == square['x'] else 'right'
        else:
            return 'top' if closest_y == square['y'] else 'bottom'


    def adjust_ball_position(self, ball, square, collision_point):
        RANDOMNESS_FACTOR = 0.8

        if collision_point == 'top':
            ball['velocityY'] = -ball['velocityY']
            ball['y'] = square['y'] - ball['radius'] - 1
        elif collision_point == 'bottom':
            ball['velocityY'] = -ball['velocityY']
            ball['y'] = square['y'] + square['height'] + ball['radius'] + 1
        elif collision_point == 'left':
            ball['velocityX'] = -ball['velocityX']
            ball['x'] = square['x'] - ball['radius'] - 1
        elif collision_point == 'right':
            ball['velocityX'] = -ball['velocityX']
            ball['x'] = square['x'] + square['width'] + ball['radius'] + 1

        angle_adjustment = random.uniform(-RANDOMNESS_FACTOR, RANDOMNESS_FACTOR)

        speed = (ball['velocityX'] ** 2 + ball['velocityY'] ** 2) ** 0.5

        angle = math.atan2(ball['velocityY'], ball['velocityX']) + angle_adjustment
        ball['velocityX'] = speed * math.cos(angle)
        ball['velocityY'] = speed * math.sin(angle)


    async def connect(self):
        self.player_id = self.scope['user'].id
        self.user = self.scope['user']
        self.map_type = False

        self.match_id = self.scope['url_route']['kwargs'].get('match_id')

        self.match = await database_sync_to_async(TournamentMatch.objects.filter(id=self.match_id).first)()
        if not self.match:
            await self.close()
            return


        logging.info("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")
        logging.info("Player ID: " + str(self.player_id))
        logging.info("Player 1 ID: " + str(self.match.player1_id))
        logging.info("Player 2 ID: " + str(self.match.player2_id))
        logging.info("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")

        if self.player_id not in [self.match.player1_id, self.match.player2_id]:
            await self.send(text_data=json.dumps({
                'error': "You are not a participant in this match."
            }))
            await self.close()
            return

        if self.player_id in connected_players:
            await self.send(text_data=json.dumps({
                'error': "You are already connected to a game."
            }))
            await self.close()
            return

        connected_players[self.player_id] = self.channel_name

        room_found = False
        for room_name, room_data in rooms.items():
            if len(room_data['players']) < MAX_PLAYERS_PER_ROOM and room_data['map_type'] == self.map_type:
                if 'match_id' in room_data and room_data['match_id'] == self.match_id:
                    self.room_group_name = room_name
                    room_data['players'].append({'player_id': self.player_id, 'channel_name': self.channel_name})
                    room_found = True
                    break

        if not room_found:
            self.room_group_name = f"room_{uuid.uuid4().hex}"
            rooms[self.room_group_name] = {
                'players': [{'player_id': self.player_id, 'channel_name': self.channel_name}],
                'map_type': self.map_type,
                'match_id': self.match_id,
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
                    },
                    'point_scored': False
                }
            }

            game = await database_sync_to_async(Game.objects.create)(map_type=self.map_type)
            rooms[self.room_group_name]['game'] = game
            match = await database_sync_to_async(TournamentMatch.objects.get)(id=self.match_id)
            match.game = game
            await database_sync_to_async(match.save)()

        await self.accept()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        if len(rooms[self.room_group_name]['players']) == MAX_PLAYERS_PER_ROOM:
          game = rooms[self.room_group_name]['game']
          players = rooms[self.room_group_name]['players']

          for i, player_info in enumerate(players):
              team = 1 if i == 0 else 2
              user = await database_sync_to_async(User.objects.get)(id=player_info['player_id'])

              link, created = await database_sync_to_async(PlayerGameLink.objects.get_or_create)(
                  player=user,
                  game=game,
                  defaults={'team': team}
              )

              if created:
                  logging.info(f"Le joueur {user} a été associé à la partie {game} avec l'équipe {team}.")
              else:
                  logging.info(f"Le joueur {user} est déjà associé à la partie {game}.")

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

              try:
                  winner_link = await database_sync_to_async(PlayerGameLink.objects.get)(player=user, game=game)
              except PlayerGameLink.DoesNotExist:
                  winner_link = await database_sync_to_async(PlayerGameLink.objects.create)(
                      player=user,
                      game=game,
                      team=1
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
                  'message': "L'autre joueur a quitté la partie.",
              }
          )



    async def start_game(self, event):
        game = rooms[self.room_group_name]['game']
        await database_sync_to_async(game.set_map_type)(self.map_type)

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

        asyncio.create_task(self.game_loop())

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'input':
            if self.room_group_name in rooms:
                game_state = rooms[self.room_group_name]['game_state']
                if self.channel_name == rooms[self.room_group_name]['players'][0]['channel_name']:
                    game_state['paddles']['left']['y'] = data['paddleY']
                else:
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
                point_scored = game_state.get('point_scored', False)

                ball['x'] += ball['velocityX']
                ball['y'] += ball['velocityY']

                if ball['y'] - ball['radius'] < 0:
                    ball['y'] = ball['radius']
                    ball['velocityY'] = -ball['velocityY']
                elif ball['y'] + ball['radius'] > SCREEN_HEIGHT:
                    ball['y'] = SCREEN_HEIGHT - ball['radius']
                    ball['velocityY'] = -ball['velocityY']

                if self.map_type:
                    squares = [
                        {'x': SQUARE1_X, 'y': SQUARE1_Y, 'width': SQUARE_WIDTH, 'height': SQUARE_HEIGHT},
                        {'x': SQUARE2_X, 'y': SQUARE2_Y, 'width': SQUARE_WIDTH, 'height': SQUARE_HEIGHT},
                    ]
                    for square in squares:
                        if self.ball_square_collision(ball, square):
                            collision_point = self.get_collision_point(ball, square)
                            self.adjust_ball_position(ball, square, collision_point)

                if not point_scored:
                    if ball['x'] - ball['radius'] < 0:
                        scores['right'] += 1
                        game_state['point_scored'] = True
                        await self.update_score('right')
                        await self.reset_ball(ball)
                    elif ball['x'] + ball['radius'] > SCREEN_WIDTH:
                        scores['left'] += 1
                        game_state['point_scored'] = True
                        await self.update_score('left')
                        await self.reset_ball(ball)

                paddle_left = {'x': 0, 'y': paddles['left']['y'], 'width': PADDLE_WIDTH, 'height': PADDLE_HEIGHT}
                paddle_right = {'x': SCREEN_WIDTH - PADDLE_WIDTH, 'y': paddles['right']['y'], 'width': PADDLE_WIDTH, 'height': PADDLE_HEIGHT}

                if self.check_collision(ball, paddle_left):
                    ball['x'] = paddle_left['x'] + paddle_left['width'] + ball['radius']
                    self.reflect_ball(ball, paddle_left)
                elif self.check_collision(ball, paddle_right):
                    ball['x'] = paddle_right['x'] - ball['radius']
                    self.reflect_ball(ball, paddle_right)

                update_counter += 1
                if update_counter % UPDATE_INTERVAL == 0:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_update',
                            'game_state': game_state
                        }
                    )
            else:
                break


    async def update_score(self, scoring_team):
        game = rooms[self.room_group_name]['game']

        left_player_link = await database_sync_to_async(PlayerGameLink.objects.get)(game=game, team=1)
        right_player_link = await database_sync_to_async(PlayerGameLink.objects.get)(game=game, team=2)

        if scoring_team == 'left':
            left_player_link.score += 1
            await database_sync_to_async(left_player_link.save)()
        else:
            right_player_link.score += 1
            await database_sync_to_async(right_player_link.save)()

        if scoring_team == 'left' and left_player_link.score >= SCORE_TO_WIN:
            left_player_link.score += 1
            await database_sync_to_async(left_player_link.save)()

            await self.end_game(left_player_link)

        elif scoring_team == 'right' and right_player_link.score >= SCORE_TO_WIN:
            right_player_link.score += 1
            await database_sync_to_async(right_player_link.save)()

            await self.end_game(right_player_link)





    async def end_game(self, winner_link):
        """End the game, mark the winner, update tournament progress, and notify players."""
        logging.info("\n\n\n\nEND GAME CALLED\n\n\n\n\n\n\n")

        game = await database_sync_to_async(lambda: winner_link.game)()
        winner_link.is_winner = True
        winner_link.reason = "Reached the maximum score."
        await database_sync_to_async(winner_link.save)()

        game.is_active = False
        await database_sync_to_async(game.save)()

        await database_sync_to_async(game.finish_game)()

        winner_name = await database_sync_to_async(lambda: winner_link.player.get_short_name())()
        winner_id = await database_sync_to_async(lambda: winner_link.player.id)()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_finished',
                'message': f"The game is over! Player {winner_name} has won.",
                'winner_name': winner_name,
                'winner_id': winner_id
            }
        )

        match = await database_sync_to_async(TournamentMatch.objects.filter(game=game).first)()
        if match:
            logging.info("\n\n\n\nIF MATCH CALLED\n\n\n\n\n\n\n")
            match.winner = await database_sync_to_async(lambda: winner_link.player)()
            match.is_complete = True
            await database_sync_to_async(match.save)()

            tournament = await database_sync_to_async(lambda: match.tournament_round.tournament)()
            logging.info(f"Advancing tournament: {tournament.name}")
            await database_sync_to_async(advance_tournament_round)(tournament)

        if self.room_group_name in rooms:
            players = rooms[self.room_group_name].get('players', [])
            for player in players:
                await self.channel_layer.group_discard(self.room_group_name, player['channel_name'])

            del rooms[self.room_group_name]




    async def game_finished(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_finished',
            'message': event['message'],
            'winner_name': event['winner_name'],  # Utilise 'winner_name'
            'winner_id': event['winner_id']       # Utilise 'winner_id'
        }))


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

      if self.room_group_name in rooms:
          rooms[self.room_group_name]['game_state']['point_scored'] = False


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
