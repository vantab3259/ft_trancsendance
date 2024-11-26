from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.shortcuts import get_object_or_404
import json
from django.db.models import Q
from django.db import transaction


from mysite.models import Tournament, TournamentRound, TournamentMatch, Game, CustomUser, TournamentParticipant
from mysite.views import require_jwt

def get_current_round(tournament):
    return tournament.rounds.last()

def initialize_next_round(tournament, winners):
    if len(winners) == 2:
        next_round = TournamentRound.objects.create(
            tournament=tournament,
            round_number=get_current_round(tournament).round_number + 1
        )
        game = Game.objects.create()
        TournamentMatch.objects.create(
            tournament_round=next_round,
            player1=winners[0],
            player2=winners[1],
            game=game
        )
        return next_round

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
        name = data.get('name', 'Tournament')
        nickname = data.get('nickname', '').strip() or request.user.pseudo
        user = request.user

        tournament = Tournament.objects.create(name=name)
        first_round = TournamentRound.objects.create(tournament=tournament, round_number=1)

        TournamentParticipant.objects.create(tournament=tournament, user=user, nickname=nickname)

        TournamentMatch.objects.create(tournament_round=first_round, player1=user)

        return JsonResponse({'status': 'success', 'tournament_id': tournament.id}, status=201)
    return JsonResponse({'error': 'Invalid method'}, status=400)



@csrf_exempt
@require_jwt
def tournament_game_view(request, match_id):
    match = get_object_or_404(TournamentMatch, id=match_id)

    if request.user not in [match.player1, match.player2]:
        return HttpResponseForbidden("You are not authorized to view this match.")

    return render(request, 'tournament_game.html', {'match_id': match_id})



@csrf_exempt
@require_jwt
def join_tournament(request, tournament_id):
    try:
        user = request.user 
        if not user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)

        data = json.loads(request.body)
        nickname = data.get('nickname', '').strip() or request.user.pseudo

        tournament = get_object_or_404(Tournament, id=tournament_id, is_active=True)

        current_round = get_current_round(tournament)

        player_ids = set()
        for p1_id, p2_id in current_round.matches.values_list('player1_id', 'player2_id'):
            if p1_id:
                player_ids.add(p1_id)
            if p2_id:
                player_ids.add(p2_id)
        total_players = len(player_ids)

        if total_players >= 4:
            return JsonResponse({'error': 'Tournament is already full.'}, status=400)

        if user.id in player_ids:
            return JsonResponse({'error': 'You have already joined this tournament.'}, status=400)

        with transaction.atomic():
            current_match = current_round.matches.select_for_update().filter(player2__isnull=True).first()
            if current_match:
                current_match.player2 = user
                current_match.save()
            else:
                TournamentMatch.objects.create(tournament_round=current_round, player1=user)

            TournamentParticipant.objects.get_or_create(tournament=tournament, user=user, defaults={'nickname': nickname})

        return JsonResponse({'status': 'success', 'message': 'Joined tournament'}, status=200)

    except Exception as e:
        print(f"Error in join_tournament: {str(e)}")
        return JsonResponse({'error': 'An error occurred while joining the tournament.'}, status=500)



@csrf_exempt
@require_jwt
def start_next_round(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id, is_active=True)
    current_round = get_current_round(tournament)

    if current_round.matches.filter(is_complete=False).exists():
        return JsonResponse({'error': 'Current round is not complete.'}, status=400)

    winners = [match.winner for match in current_round.matches.all() if match.winner]
    if len(winners) != 2 and len(winners) != 4:
        return JsonResponse({'error': 'Invalid number of players for the next round.'}, status=400)

    if len(winners) == 2:
        next_round = initialize_next_round(tournament, winners)
        tournament.is_active = False
        tournament.date_finished = timezone.now()
        tournament.save()
        return JsonResponse({'status': 'success', 'message': 'Tournament completed', 'winner': winners[0].id})

    next_round = initialize_next_round(tournament, winners)
    return JsonResponse({'status': 'success', 'message': 'Next round started', 'round_number': next_round.round_number})

def update_tournament_progress(tournament, match):
    """
    Updates the progress of a tournament based on the completion of a match.
    
    Args:
        tournament (Tournament): The tournament to update.
        match (TournamentMatch): The recently completed match.
    """
    match.is_complete = True
    match.save()

    current_round = get_current_round(tournament)
    if current_round.matches.filter(is_complete=False).exists():
        return

    winners = [m.winner for m in current_round.matches.all() if m.winner]

    if len(winners) == 1:
        tournament.is_active = False
        tournament.date_finished = timezone.now()
        tournament.save()
        print(f"Tournament {tournament.name} completed. Winner: {winners[0].id}")
        return

    if len(winners) in [2, 4]:
        next_round = initialize_next_round(tournament, winners)
        print(f"Next round {next_round.round_number} initialized for Tournament {tournament.name}.")
    else:
        raise ValueError("Invalid number of winners to proceed to the next round.")



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

    tournament = match.tournament_round.tournament
    update_tournament_progress(tournament, match)

    return JsonResponse({'status': 'success', 'message': 'Match finished', 'winner_id': winner.id})




@csrf_exempt
@require_jwt
def tournament_details(request, tournament_id):
    def serialize_user(user, tournament):
        if user:
            participant = TournamentParticipant.objects.filter(tournament=tournament, user=user).first()
            nickname = participant.nickname if participant else user.pseudo
            return {
                'id': user.id,
                'pseudo': nickname,
                'email': user.email,
                'profile_picture_url': user.get_profile_picture_url()
            }
        return None

    tournament = get_object_or_404(Tournament, id=tournament_id)
    current_user_id = request.user.id


    players = set()
    for match in tournament.rounds.first().matches.all():
        if match.player1:
            players.add(match.player1)
        if match.player2:
            players.add(match.player2)

    rounds = [
        {
            'round_number': rnd.round_number,
            'matches': [
                {
                    'match_id': match.id,
                    'player1': serialize_user(match.player1, tournament),
                    'player2': serialize_user(match.player2, tournament),
                    'winner': serialize_user(match.winner, tournament),
                    'is_complete': match.is_complete,
                    'is_current_user_in_match': (
                        (match.player1_id == current_user_id) or (match.player2_id == current_user_id)
                    )
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
            'date_created': tournament.date_created.isoformat(),
            'date_finished': tournament.date_finished.isoformat() if tournament.date_finished else None,
            'rounds': rounds,
            'players': [serialize_user(player, tournament) for player in players]
        }
    }, status=200)
