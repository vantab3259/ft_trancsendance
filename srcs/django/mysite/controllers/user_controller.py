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
