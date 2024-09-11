from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mysite.models import CustomUser
from django.utils.html import escape
from django.contrib.auth import *



@csrf_exempt
def signup(request):

    if request.method == 'POST':
        name = escape(request.POST.get('name'))
        email = escape(request.POST.get('email'))
        password = escape(request.POST.get('password'))

        user = CustomUser()
        user.first_name = name
        user.email = email
        user.set_password(password)

        user.save()
        login(request, user)
        return JsonResponse({'message': 'Utilisateur créé avec succès !'})

@csrf_exempt
def signin(request):

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Authentification de l'utilisateur
        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({'message': 'Connexion réussie !'})
        else:
            return JsonResponse({'error': 'Identifiants invalides. Utilisateur non trouvé.'})
    else:
        return JsonResponse({'error': 'Méthode non autorisée. Utilisez POST.'})


@csrf_exempt
def logout_view(request):
    logout(request)
    return render(request, 'login/login.html')
