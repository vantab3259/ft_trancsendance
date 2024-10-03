import datetime
import uuid

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mysite.models import CustomUser
from django.utils.html import escape
from django.contrib.auth import *
import os
import mimetypes
from authlib.integrations.requests_client import OAuth2Session
import json
from shutil import copyfile
from django.core.files import File
import requests
from dotenv import load_dotenv
import base64
from io import BytesIO
from django_otp.plugins.otp_totp.models import TOTPDevice
from qrcode import make as make_qr



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
            return JsonResponse({
                'status': 'success',
                'message': 'Utilisateur connecté avec succès !',
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
            user.birth_date = datetime.datetime.strptime(birth_date, '%Y-%m-%d').date()
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

        api_ft = OAuth2Session(
            client_id=client_id,
            client_secret=client_secret,
            scope=scope,
            redirect_uri=redirect_uri
        )

        token = api_ft.fetch_token(
            'https://api.intra.42.fr/oauth/token',
            code=code,
            client_secret=client_secret
        )

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
            user.save()
            login(request, user)
            message = "Connexion réussie"
        else:
            user = CustomUser.objects.create(
                first_name=first_name,
                last_name=last_name,
                pseudo=pseudo,
                email=email,
                access_token=token['access_token'],
                access_code=code,
                profile_picture = download_and_save_profile_picture(profile_picture),
                coalition_color = coalition_color,
                coalition_cover_url = coalition_cover_url,
                coalition_image_url = coalition_image_url,
                coalition_name = coalition_name,
                coalition_slug = coalition_slug,
                coalition_id = coalition_id
            )
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
            'pure': user_info,
            'coalitions': coalitions,
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

@login_required
def get_qr_code(request):
    # Créer ou obtenir le dispositif TOTP de l'utilisateur
    device, created = TOTPDevice.objects.get_or_create(user=request.user, confirmed=False)
    
    # Générer l'URI pour le QR code
    otp_uri = device.config_url

    # Créer le QR code à partir de cet URI
    qr_img = make_qr(otp_uri)

    # Convertir l'image en base64
    buffer = BytesIO()
    qr_img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    # Renvoyer le QR code encodé en base64 dans une réponse JSON
    return JsonResponse({'qr_code': qr_code_base64})

@login_required
def check_qr_scanned(request):
    try:
        device = TOTPDevice.objects.get(user=request.user)
        if device.last_t:
            return JsonResponse({'scanned': True})
        else:
            return JsonResponse({'scanned': False})
    except TOTPDevice.DoesNotExist:
        return JsonResponse({'scanned': False})