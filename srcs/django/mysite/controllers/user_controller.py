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
        login(request, user)
        token = generate_jwt(user)
        if not user.active_tokens:
            user.active_tokens = []
        user.active_tokens.append(token)
        user.save()
        return JsonResponse({
            'status': 'success',
            'message': 'User created !',
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
            user.save()
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

@require_jwt
@csrf_exempt
def logout_view(request):
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
        login(request, user)
        if user.two_fa_code_is_active:
            user.two_fa_code_is_checked = False
            user.save()
            code = two_fa_code_gen(user)
            send_code_mail(code, user.email)
            return JsonResponse({'wait-two-fa': True}, status=200)

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
                }
                for user in users if user != request.user
            ]

            return JsonResponse({'status': 'success', 'users': user_data}, status=200)

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

        user = CustomUser.objects.search_by_id(id)
        if user:
            user_data = {
                'id': user.id,
                'pseudo': user.pseudo,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_picture': user.get_profile_picture_url(),
            }
            if mode == 'pending':
                request.user.friends.add(user)
                user.friends.add(request.user)
                request.user.friends_request.remove(user)
                user.friends_send_request.remove(request.user)
            else:
                request.user.friends_send_request.add(user)
                user.friends_request.add(request.user)
            user.save()
            request.user.save()
        else:
            return JsonResponse({'error': 'No user at this id', 'id': id}, status=400)
        return JsonResponse({'status': 'success', 'users': user_data}, status=200)
    return JsonResponse({'error': 'Invalid request method. Use POST.'}, status=400)


@csrf_exempt
def generate_jwt(user):
    load_dotenv()
    secret_key_jwt = os.getenv('SECRET_KEY_JWT')
    expiration_time = datetime.utcnow() + timedelta(hours=1)  # Token valable 1 heure
    token = jwt.encode({
        'user_id': user.id,
        'exp': expiration_time
    }, secret_key_jwt, algorithm='HS256')
    return token
