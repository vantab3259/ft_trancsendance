from django.shortcuts import render
from django.http import HttpResponse

def home(request):
	return render(request, 'login/login.html')

def login(request):
	return render(request, 'login/login.html')

def about(request):
    return render(request, 'about.html')

def dashboard(request):
    return render(request, 'dashboard/dashboard.html')

def dashboard_content(request):
    return render(request, 'dashboard/dashboard_content.html')

def home_content(request):
    return render(request, 'home/home_content.html')

def pong(request):
    return render(request, 'pong/pong.html')

def pong_content(request):
    return render(request, 'pong/pong_content.html')

def profile_edit(request):
    return render(request, 'profile/profile_edit.html')

def profile_edit_content(request):
    return render(request, 'profile/profile_edit_content.html')

def ranking(request):
    return render(request, 'ranking/ranking.html')

def ranking_content(request):
    return render(request, 'ranking/ranking_content.html')

def history_match(request):
    return render(request, 'history_match/history_match.html')

def history_match_content(request):
    return render(request, 'history_match/history_match_content.html')

def tournament(request):
    return render(request, 'tournament/tournament.html')

def tournament_content(request):
    return render(request, 'tournament/tournament_content.html')

def lobby(request):
    return render(request, 'lobby/lobby.html')

def lobby_content(request):
    return render(request, 'lobby/lobby_content.html')

from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CustomUser


@csrf_exempt
def signup(request):

    print("\n\n\n\n\n\n\nttttttttttttttttttsdfpijsdfosdoifgsopigh[sifg[sfdg[sjg]ipsdg]is]idj]hsdh]dskhjgj]ttt\n\n\n\n\n\n\n")
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')

        user = CustomUser()
        user.first_name = name
        user.email = email
        user.set_password(password)

        user.save()

        return JsonResponse({'message': 'Utilisateur créé avec succès !'})
    else:
        return render(request, 'signup.html')