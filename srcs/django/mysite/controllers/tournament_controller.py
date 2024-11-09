from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.shortcuts import get_object_or_404
import json

from mysite.models import Tournament, TournamentRound, TournamentMatch, Game, CustomUser
from mysite.views import require_jwt

def get_current_round(tournament):
    return tournament.rounds.last()

def initialize_next_round(tournament, winners):
    next_round = TournamentRound.objects.create(
        tournament=tournament,
        round_number=get_current_round(tournament).round_number + 1
    )
    for i in range(0, len(winners), 2):
        player1 = winners[i]
        player2 = winners[i + 1] if i + 1 < len(winners) else None
        game = Game.objects.create()
        TournamentMatch.objects.create(
            tournament_round=next_round,
            player1=player1,
            player2=player2,
            game=game
        )
    return next_round


@csrf_exempt
@require_jwt
def create_tournament(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        name = data.get('name')
        if not name:
            return JsonResponse({'error': 'Tournament name is required'}, status=400)

        tournament = Tournament.objects.create(name=name)
        TournamentRound.objects.create(tournament=tournament, round_number=1)
        
        return JsonResponse({'status': 'success', 'tournament_id': tournament.id}, status=201)
    return JsonResponse({'error': 'Invalid method'}, status=400)


@csrf_exempt
@require_jwt
def join_tournament(request, tournament_id):
    user = request.user
    tournament = get_object_or_404(Tournament, id=tournament_id, is_active=True)

    if tournament.rounds.exists() and tournament.rounds.first().matches.exists():
        return JsonResponse({'error': 'Tournament has already started.'}, status=400)

    if any(match.player1 == user or match.player2 == user for match in tournament.rounds.first().matches.all()):
        return JsonResponse({'error': 'User is already in the tournament.'}, status=400)

    current_round = get_current_round(tournament)
    if current_round.matches.count() % 2 == 0:
        TournamentMatch.objects.create(tournament_round=current_round, player1=user)
    else:
        current_match = current_round.matches.last()
        current_match.player2 = user
        current_match.save()

    return JsonResponse({'status': 'success', 'message': 'Joined tournament'}, status=200)


@csrf_exempt
@require_jwt
def start_next_round(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id, is_active=True)
    current_round = get_current_round(tournament)

    if current_round.matches.filter(is_complete=False).exists():
        return JsonResponse({'error': 'Current round is not complete.'}, status=400)

    winners = [match.winner for match in current_round.matches.all() if match.winner]
    if len(winners) == 1:
        tournament.is_active = False
        tournament.date_finished = timezone.now()
        tournament.save()
        return JsonResponse({'status': 'success', 'message': 'Tournament completed', 'winner': winners[0].id})
    
    next_round = initialize_next_round(tournament, winners)
    return JsonResponse({'status': 'success', 'message': 'Next round started', 'round_number': next_round.round_number})


@csrf_exempt
@require_jwt
def finish_match(request, match_id):
    data = json.loads(request.body)
    winner_id = data.get('winner_id')
    
    match = get_object_or_404(TournamentMatch, id=match_id)
    winner = get_object_or_404(CustomUser, id=winner_id)

    if winner not in [match.player1, match.player2]:
        return JsonResponse({'error': 'Winner must be one of the match participants.'}, status=400)

    match.finish_match(winner)

    current_round = match.tournament_round
    if not current_round.matches.filter(is_complete=False).exists():
        current_round.check_and_start_next_round()

    return JsonResponse({'status': 'success', 'message': 'Match finished', 'winner_id': winner.id})


@csrf_exempt
@require_jwt
def tournament_details(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    rounds = [
        {
            'round_number': rnd.round_number,
            'matches': [
                {
                    'match_id': match.id,
                    'player1': match.player1.get_short_name() if match.player1 else None,
                    'player2': match.player2.get_short_name() if match.player2 else None,
                    'winner': match.winner.get_short_name() if match.winner else None,
                    'is_complete': match.is_complete
                }
                for match in rnd.matches.all()
            ]
        }
        for rnd in tournament.rounds.all()
    ]

    return JsonResponse({
        'status': 'success',
        'tournament': {
            'id': tournament.id,
            'name': tournament.name,
            'is_active': tournament.is_active,
            'date_created': tournament.date_created,
            'date_finished': tournament.date_finished,
            'rounds': rounds,
        }
    }, status=200)
