import uuid
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from mysite.views import require_jwt
from mysite.models import CustomUser
from django.utils.html import escape
from django.contrib.auth import *
import os
import mimetypes
from authlib.integrations.requests_client import OAuth2Session
import json
import requests
from dotenv import load_dotenv
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils import timezone
import jwt
from datetime import datetime, timedelta
from django.conf import settings
import logging
from mysite.models.game import Game, PlayerGameLink


@csrf_exempt
def signup(request):
    if request.method == 'POST':
        pseudo = escape(request.POST.get('name'))
        email = escape(request.POST.get('email'))
        password = escape(request.POST.get('password'))

        user = CustomUser()
        user.pseudo = pseudo
        user.email = email
        user.set_password(password)

        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid User !',
                'errors': 'Errors : Email is already use.'
            })
        
        user.save()
        user = authenticate(request, username=email, password=password)
        login(request, user)
        token = generate_jwt(user)
        if not user.active_tokens:
            user.active_tokens = []
        user.active_tokens.append(token)
        user.is_online = True
        user.save()
        login(request, user)
        return JsonResponse({
            'status': 'success',
            'message': 'User created !',
            'token': token,

            'data': {
                'user': user.getJson()
            }
        }, status=201)


@csrf_exempt
def signin(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Authentification de l'utilisateur
        user = authenticate(request, username=email, password=password)

        if user is not None:

            login(request, user)
            token = generate_jwt(user)
            if not user.active_tokens:
                user.active_tokens = []
            user.active_tokens.append(token)
            user.is_online = True
            user.save()
            if user.two_fa_code_is_active:
                user.two_fa_code_is_checked = False
                user.save()
                code = two_fa_code_gen(user)
                send_code_mail(code, user.email)
                return JsonResponse({
                    'wait-two-fa': True,
                    'token' : token,
                }, status=200)
            return JsonResponse({
                'status': 'success',
                'message': 'Utilisateur connecté avec succès !',
                'token': token,
                'data': {
                    'user': user.getJson()
                }
            }, status=201)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Utilisateur invalide !',
                'errors': 'Errors : Email / Password is Invalid.'
            })
    else:
        return JsonResponse({'error': 'Méthode non autorisée. Utilisez POST.'})

@csrf_exempt
def logout_view(request):
    request.user.is_online = False
    request.user.save()
    logout(request)
    return JsonResponse({'message': 'Déconnexion réussie !'})


def is_safe_file(file_path):
    authorized_directory = '/path/to/authorized/directory'

    if not os.path.commonpath([authorized_directory, file_path]) == authorized_directory:
        return False

    mimetype, _ = mimetypes.guess_type(file_path)
    if mimetype and mimetype.startswith('image'):
        return True
    return False

@require_jwt
@login_required(login_url='/login/')
@csrf_exempt
def profile_edit_form(request):
    if request.method == 'POST':
        user = request.user

        user.first_name = escape(request.POST.get('first-name'))
        user.last_name = escape(request.POST.get('last-name'))
        user.email = escape(request.POST.get('email'))
        user.phone_number = escape(request.POST.get('phone'))
        user.last_name = escape(request.POST.get('last-name'))
        user.pseudo = escape(request.POST.get('pseudo'))
        user.birth_city = escape(request.POST.get('birth-city'))
        birth_date = request.POST.get('birth-date')

        if birth_date:
            user.birth_date = datetime.strptime(birth_date, '%Y-%m-%d').date()
            user.save()

        if 'profile-picture' in request.FILES:
            if user.profile_picture:
                profile_picture_path = user.profile_picture.path
                if os.path.exists(profile_picture_path) and is_safe_file(profile_picture_path):
                    user.profile_picture.delete(save=False)

            ext = request.FILES['profile-picture'].name.split('.')[-1]
            unique_filename = f"profile_{uuid.uuid4().hex}.{ext}"
            user.profile_picture.save(unique_filename, request.FILES['profile-picture'], save=False)

        user.save()
        login(request, user)

        return JsonResponse({'message': 'Profil mis à jour avec succès !'})

    return JsonResponse({'error': 'Requête invalide'}, status=400)


@csrf_exempt
def get_oth_autorization(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        code = data.get('code')
        method_sign = escape(data.get('sign_method'))

        load_dotenv()

        client_id = os.getenv('API_42_CLIENT_ID')
        client_secret = os.getenv('API_42_CLIENT_SECRET')
        redirect_uri = os.getenv('API_42_REDIRECT_URI')
        scope = os.getenv('API_42_SCOPE')

        if not all([client_id, client_secret, redirect_uri, scope]):
            return JsonResponse({'error': 'Missing client configuration'}, status=500)

        api_ft = OAuth2Session(
            client_id=client_id,
            client_secret=client_secret,
            scope=scope,
            redirect_uri=redirect_uri
        )

        try:
            token = api_ft.fetch_token(
                'https://api.intra.42.fr/oauth/token',
                code=code,
                client_secret=client_secret,
                include_client_id=True
            )
        except Exception as e:
            return JsonResponse({'error co ': str(e)}, status=400)

        user_info = api_ft.get('https://api.intra.42.fr/v2/me').json()

        first_name = user_info['first_name']
        last_name = user_info['last_name']
        pseudo = user_info['login']
        email = user_info['email']
        profile_picture = user_info['image']['link']
        user_api_id = user_info['id']
        coalitions = api_ft.get('https://api.intra.42.fr/v2/users/' + str(user_api_id) + '/coalitions').json()
        coalition_color = coalitions[1]['color']
        coalition_cover_url = coalitions[1]['cover_url']
        coalition_image_url = coalitions[1]['image_url']
        coalition_name = coalitions[1]['name']
        coalition_slug = coalitions[1]['slug']
        coalition_id = coalitions[1]['id']

        

        if CustomUser.objects.filter(email=email).exists():
            user = CustomUser.objects.get(email=email)

            user.access_token = token['access_token']
            user.access_code = code
            if not user.first_name:
                user.first_name = first_name
            if not user.last_name:
                user.last_name = last_name
            if not user.pseudo:
                user.pseudo = pseudo
            if not user.email:
                user.email = email
            user.coalition_color = coalition_color
            user.coalition_cover_url = coalition_cover_url
            user.coalition_image_url = coalition_image_url
            user.coalition_name = coalition_name
            user.coalition_slug = coalition_slug
            user.coalition_id = coalition_id
            message = "Connexion réussie"
        else:
            user = CustomUser.objects.create(
                first_name=first_name,
                last_name=last_name,
                pseudo=pseudo,
                email=email,
                access_token=token['access_token'],
                access_code=code,
                profile_picture=download_and_save_profile_picture(profile_picture),
                coalition_color=coalition_color,
                coalition_cover_url=coalition_cover_url,
                coalition_image_url=coalition_image_url,
                coalition_name=coalition_name,
                coalition_slug=coalition_slug,
                coalition_id=coalition_id
            )

        user.save()
        token = generate_jwt(user)
        if not user.active_tokens:
            user.active_tokens = []
        user.active_tokens.append(token)
        user.save()

        if user.two_fa_code_is_active:
            user.two_fa_code_is_checked = False
            user.save()
            code = two_fa_code_gen(user)
            send_code_mail(code, user.email)
            return JsonResponse({
                'wait-two-fa': True,
                'token' : token,
            }, status=200)

        user.is_online = True
        user.save()
        login(request, user)

        message = "Utilisateur créé et connecté"
        return JsonResponse({
            'message': message,
            'login': True,
            'user_info_api': {
                'first_name': first_name,
                'last_name': last_name,
                'pseudo': pseudo,
                'email': email
            },
            'user': user.getJson(),
            'id_loggin': request.user.id,
            'pure': user_info,
            'coalitions': coalitions,
            'token': token,
        })

    return JsonResponse({'error': 'init error'}, status=400)

def download_and_save_profile_picture(image_url):
    response = requests.get(image_url, stream=True, verify=False)
    if response.status_code == 200:
        unique_filename = f'{uuid.uuid4()}.jpg'

        media_dir = os.path.join(settings.MEDIA_ROOT, 'profile_pics')
        if not os.path.exists(media_dir):
            os.makedirs(media_dir)

        final_path = os.path.join(media_dir, unique_filename)
        with open(final_path, 'wb') as out_file:
            out_file.write(response.content)
        return f'profile_pics/{unique_filename}'
    else:
        raise Exception(f"Impossible de télécharger l'image. Statut du serveur : {response.status_code}")


def two_fa_code_gen(user):
    two_fa_code = ""

    if user.two_fa_code_is_active:
        two_fa_code = str(uuid.uuid4().int)[:6]
        user.two_fa_code = two_fa_code
        user.last_two_fa_code = timezone.now()
        user.save()

    return two_fa_code


def send_code_mail(code, mailTo):
    subject = "Ft-Transcendence CODE : " + str(code)
    message = "Bonjour,\n\nVoici votre code : " + str(code) + ".\n\n\nCordialement,\nl'equipe 42.\n"
    email_from = os.getenv('EMAIL_HOST_USER')
    tos = [mailTo]

    send_mail(
        subject,
        message,
        email_from,
        tos,
        fail_silently=False,
    )
    return JsonResponse({'message': 'Email envoyé avec succès !'}, status=200)

@require_jwt
@csrf_exempt
def set_two_fa_code(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        checked = data.get('checked', False)
        user = request.user
        user.two_fa_code_is_active = checked
        user.save()
        return JsonResponse({'message': 'Profil Updated !'}, status=200)
    return JsonResponse({'error': 'POST ONLY'}, status=400)

@require_jwt
@csrf_exempt
def check_two_fa_code(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        codeInput = data.get('codeInput', "")
        codeInput = codeInput.replace(' ', '')
        user = request.user

        if user.two_fa_code_is_active and user.two_fa_code == codeInput:
            now = timezone.now()
            time_difference = now - user.last_two_fa_code

            if time_difference < timedelta(minutes=5):
                user.last_two_fa_code = None
                user.two_fa_code = ""
                user.two_fa_code_is_checked = True
                user.save()
                login(request, user)


                return JsonResponse(
                    {'message': 'Code validé et profil mis à jour !', 'check': True, 'user': user.getJson()},
                    status=200)
            else:
                return JsonResponse({'message': 'Le code a expiré !', 'check': False}, status=400)
        else:
            return JsonResponse({'message': 'Code incorrect !', 'check': False}, status=400)

    return JsonResponse({'error': 'POST uniquement'}, status=400)

@require_jwt
@csrf_exempt
def search_users(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        query = data.get('query', '')
        mode = data.get('mode', '')
        

        if mode in ['add', 'friends', 'pending']:
            users = CustomUser.objects.search_by_pseudo_or_email(query, request.user, mode)
            user_data = [
                {
                    'id': user.id,
                    'pseudo': user.pseudo,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.get_profile_picture_url(),
                    'is_online': user.is_online,
                }
                for user in users if user != request.user
            ]

            return JsonResponse({'status': 'success', 'users': user_data, 'mode': mode}, status=200)

        else:
            return JsonResponse({'error': 'No query provided.', 'query': query}, status=400)

    return JsonResponse({'error': 'Invalid request method. Use POST.'}, status=400)

@require_jwt
@csrf_exempt
def request_friend(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        id = data.get('query', '')
        mode = data.get('mode', '')
        
        userToInvite = CustomUser.objects.search_by_id(id)
        if userToInvite:
            user_data = {
                'id': userToInvite.id,
                'pseudo': userToInvite.pseudo,
                'email': userToInvite.email,
                'first_name': userToInvite.first_name,
                'last_name': userToInvite.last_name,
                'profile_picture': userToInvite.get_profile_picture_url(),
            }
            if mode == 'pending':
                request.user.friends.add(userToInvite)
                userToInvite.friends.add(request.user)
                request.user.friends_request.remove(userToInvite)
                userToInvite.friends_send_request.remove(request.user)

            elif mode == "add":
                request.user.friends_send_request.add(userToInvite)
                userToInvite.friends_request.add(request.user)

            userToInvite.save()
            request.user.save()
        else:
            return JsonResponse({'error': 'No user at this id', 'id': id}, status=400)
        return JsonResponse({'status': 'success', 'users': user_data}, status=200)
    return JsonResponse({'error': 'Invalid request method. Use POST.'}, status=400)


@csrf_exempt
def generate_jwt(user):
    load_dotenv()
    secret_key_jwt = os.getenv('SECRET_KEY_JWT')
    expiration_time = datetime.utcnow() + timedelta(hours=6)  # Token valable 1 heure
    token = jwt.encode({
        'user_id': user.id,
        'exp': expiration_time
    }, secret_key_jwt, algorithm='HS256')
    return token

@csrf_exempt
def update_online_status(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'status': 'success'}, status=200)

        load_dotenv()
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        secret_key_jwt = os.getenv('SECRET_KEY_JWT')

        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                jwt.decode(token, secret_key_jwt, algorithms=['HS256'])
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expiré'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Token invalide'}, status=401)
        else:
            return JsonResponse({'error': 'Token manquant'}, status=401)

        request.user.is_online = True
        request.user.last_time_check_is_online = timezone.now()
        request.user.save()

        ten_minutes_ago = timezone.now() - timedelta(minutes=10)
        CustomUser.objects.filter(is_online=True, last_time_check_is_online__lt=ten_minutes_ago).update(is_online=False)

        return JsonResponse({'status': 'success'}, status=200)

    return JsonResponse({'error': 'Invalid request method. Use POST.'}, status=400)

from django.db.models import Count, Q

@csrf_exempt
def getRanking(request):
    try:
        # Récupérer tous les utilisateurs avec leur nombre de victoires et de titres
        ranking = (
            CustomUser.objects.annotate(
                matches_won=Count(
                    'playergamelink',
                    filter=Q(playergamelink__is_winner=True)
                ),
                titles_won=Count(
                    'playergamelink',
                    filter=Q(playergamelink__is_winner=True, playergamelink__reason__icontains="Title")
                )
            )
            .order_by('-matches_won', '-titles_won')
        )

        # Transformer ces objets en une structure de données utile
        leaderboard = []
        for position, player in enumerate(ranking, start=1):
            leaderboard.append({
                'position': position,
                'id': player.id,
                'name': f"{player.first_name} {player.last_name}",
                'pseudo': player.pseudo,
                'profile_picture_url': player.get_profile_picture_url(),
                'matches_won': player.matches_won,
                'titles_won': player.titles_won
            })

        # Retourner les données dans une réponse JSON
        return JsonResponse({'status': 'success', 'players': leaderboard}, status=200)

    except Exception as e:
        # En cas d'erreur, retourner une réponse JSON avec un message d'erreur
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
@csrf_exempt
def get_history_game(request):
    try:
        # Récupérer l'utilisateur connecté
        user = request.user

        # Récupérer tous les liens de jeux pour cet utilisateur, triés par date de création (du plus récent au plus ancien)
        games = PlayerGameLink.objects.filter(player=user).select_related('game').order_by('-game__date_created')

        # Transformer ces objets en une structure de données utile
        game_history = []
        for game_link in games:
            opponent = PlayerGameLink.objects.filter(game=game_link.game).exclude(player=user).first()

            # Calculer la durée du jeu si cette info est disponible
            if game_link.game.date_created and game_link.game.date_finish:
                duration = game_link.game.date_finish - game_link.game.date_created
                duration_in_seconds = duration.total_seconds()
                minutes, seconds = divmod(duration_in_seconds, 60)
                duration_str = f"{int(minutes)}min {int(seconds)}s"
            else:
                duration_str = "N/A"

            # Déterminer si c'est une victoire ou une défaite
            result = "match-victory" if game_link.is_winner else "match-defeat"

            game_history.append({
                'opponent_name': opponent.player.pseudo if opponent else "Unknown",
                'opponent_image': opponent.player.get_profile_picture_url() if opponent else "",
                'date': game_link.game.date_created.strftime("%Y-%m-%d %H:%M") if game_link.game.date_created else "Unknown",
                'score': f"{game_link.score}-{opponent.score if opponent else 0}",
                'duration': duration_str,
                'result': result
            })

        return JsonResponse({'status': 'success', 'games': game_history}, status=200)

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@require_jwt
@csrf_exempt
def get_blocked_list(request):
    if request.method == 'GET':
        user = request.user
        blocked_list = user.blocked_list

        blocked_users = CustomUser.objects.filter(id__in=blocked_list)
        user_data = [
            {
                'id': user.id,
                'pseudo': user.pseudo,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_picture': user.get_profile_picture_url(),
                'is_online': user.is_online,
            }
            for user in blocked_users
        ]

        return JsonResponse({'status': 'success', 'blocked_users': user_data}, status=200)

    return JsonResponse({'error': 'Invalid request method. Use GET.'}, status=400)

@require_jwt
@csrf_exempt
def add_to_blocked_list(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_to_block_id = data.get('id', None)

        if not user_to_block_id:
            return JsonResponse({'error': 'User ID not provided.'}, status=400)

        try:
            user_to_block = CustomUser.objects.get(id=user_to_block_id)
            user = request.user

            if user_to_block.id == user.id:
                return JsonResponse({'error': 'You cannot block yourself.'}, status=400)

            if user_to_block.id not in user.blocked_list:
                user.blocked_list.append(user_to_block.id)
                user.save()
            return JsonResponse({'status': 'success', 'message': 'User added to blocked list.'}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User does not exist.'}, status=404)

    return JsonResponse({'error': 'Invalid request method. Use POST.'}, status=400)

@require_jwt
@csrf_exempt
def remove_from_blocked_list(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_to_unblock_id = data.get('id', None)

        if not user_to_unblock_id:
            return JsonResponse({'error': 'User ID not provided.'}, status=400)

        try:
            user_to_unblock = CustomUser.objects.get(id=user_to_unblock_id)
            user = request.user

            if user_to_unblock.id in user.blocked_list:
                user.blocked_list.remove(user_to_unblock.id)
                user.save()
            return JsonResponse({'status': 'success', 'message': 'User removed from blocked list.'}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User does not exist.'}, status=404)

    return JsonResponse({'error': 'Invalid request method. Use POST.'}, status=400)



@require_jwt
@csrf_exempt
def get_user_by_id(request):
    """
    Retrieve user information by user ID or pseudo.
    """
    if request.method == 'GET':
        identifier = request.GET.get('user_id')

        if not identifier:
            return JsonResponse({'error': 'User ID or pseudo must be provided'}, status=400)

        try:
            if identifier.isdigit():
                users = CustomUser.objects.filter(id=identifier)
            else:  # Sinon pseudo
                users = CustomUser.objects.filter(pseudo=identifier)

            if not users.exists():
                return JsonResponse({'error': 'User not found'}, status=404)

            # Récupérer le premier utilisateur
            user = users.first()

            user_data = {
                'id': user.id,
                'pseudo': user.pseudo,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number, 
                'profile_picture': user.get_profile_picture_url(),
                'is_online': user.is_online,
            }
            return JsonResponse({'status': 'success', 'user': user_data}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method. Use GET.'}, status=400)




@require_jwt
@csrf_exempt
def get_user_match_history(request):
    """
    Retrieve the match history of a user by their ID.
    """
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'User ID not provided'}, status=400)

        try:
            user = CustomUser.objects.get(id=user_id)

            # Récupérer tous les liens de jeux pour cet utilisateur, triés par date de création (du plus récent au plus ancien)
            games = PlayerGameLink.objects.filter(player=user).select_related('game').order_by('-game__date_created')

            # Transformer ces objets en une structure de données utile
            game_history = []
            for game_link in games:
                opponent = PlayerGameLink.objects.filter(game=game_link.game).exclude(player=user).first()

                # Calculer la durée du jeu si cette info est disponible
                if game_link.game.date_created and game_link.game.date_finish:
                    duration = game_link.game.date_finish - game_link.game.date_created
                    duration_in_seconds = duration.total_seconds()
                    minutes, seconds = divmod(duration_in_seconds, 60)
                    duration_str = f"{int(minutes)}min {int(seconds)}s"
                else:
                    duration_str = "N/A"

                # Déterminer si c'est une victoire ou une défaite
                result = "match-victory" if game_link.is_winner else "match-defeat"

                game_history.append({
                    'opponent_name': opponent.player.pseudo if opponent else "Unknown",
                    'opponent_image': opponent.player.get_profile_picture_url() if opponent else "",
                    'date': game_link.game.date_created.strftime("%Y-%m-%d %H:%M") if game_link.game.date_created else "Unknown",
                    'score': f"{game_link.score}-{opponent.score if opponent else 0}",
                    'duration': duration_str,
                    'result': result
                })

            return JsonResponse({'status': 'success', 'games': game_history}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)

    return JsonResponse({'error': 'Invalid request method. Use GET.'}, status=400)


@require_jwt
@csrf_exempt
def give_me_my_id(request):
    if request.method == 'GET':

        return JsonResponse({'status': 'success', 'id': request.user.id}, status=200)
    return JsonResponse({'error': 'Invalid request method. Use GET.'}, status=400)