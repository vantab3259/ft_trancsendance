from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required

from django.shortcuts import redirect
from functools import wraps
from urllib.parse import urlencode
import jwt
from functools import wraps
from django.conf import settings
from django.http import JsonResponse
from mysite.models.user import CustomUser
import os
from dotenv import load_dotenv

def not_logged_in_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.two_fa_code_is_checked:
            return redirect('/dashboard/')
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def require_jwt(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        load_dotenv()
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        secret_key_jwt = os.getenv('SECRET_KEY_JWT')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                decoded = jwt.decode(token, secret_key_jwt, algorithms=['HS256'])
                user = CustomUser.objects.get(id=decoded['user_id'])
                request.user = user
                return view_func(request, *args, **kwargs)
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expiré'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Token invalide', 'token' : token}, status=401)
        else:
            return JsonResponse({'error': 'Token manquant'}, status=401)
    return _wrapped_view

def two_fa_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated:
            user = request.user
            if user.two_fa_code_is_active and not user.two_fa_code_is_checked:
                query_params = request.GET.urlencode()
                full_path = f'{request.path}?{query_params}' if query_params else request.path
                return redirect(f'/login/?next3%D{full_path}')
        else:
            query_params = request.GET.urlencode()
            full_path = f'{request.path}?{query_params}' if query_params else request.path
            return redirect(f'/login/?next3%D{full_path}')
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view


@two_fa_required
def home(request):
	return render(request, 'login/login.html')

@two_fa_required
def base(request):
	return render(request, 'base/base.html')

@not_logged_in_required
def login(request):
	return render(request, 'base/base.html')

@login_required(login_url='/login/')
def about(request):
    return render(request, 'about.html')

@login_required(login_url='/login/')
def dashboard(request):
    return render(request, 'dashboard/dashboard.html')

@login_required(login_url='/login/')
def dashboard_content(request):
    return render(request, 'dashboard/dashboard_content.html')

@login_required(login_url='/login/')
def home_content(request):
    return render(request, 'home/home_content.html')

@login_required(login_url='/login/')
def pong(request):
    return render(request, 'pong/pong.html')

@login_required(login_url='/login/')
def pong_content(request):
    return render(request, 'pong/pong_content.html')

@login_required(login_url='/login/')

def profile_edit(request):
    return render(request, 'profile/profile_edit.html')

@login_required(login_url='/login/')

def profile_edit_content(request):
    return render(request, 'profile/profile_edit_content.html')

@login_required(login_url='/login/')

def ranking(request):
    return render(request, 'ranking/ranking.html')

@login_required(login_url='/login/')

def ranking_content(request):
    return render(request, 'ranking/ranking_content.html')

@login_required(login_url='/login/')

def history_match(request):
    return render(request, 'history_match/history_match.html')

@login_required(login_url='/login/')

def history_match_content(request):
    return render(request, 'history_match/history_match_content.html')

@login_required(login_url='/login/')

def tournament(request):
    return render(request, 'tournament/tournament.html')

@login_required(login_url='/login/')

def tournament_content(request):
    return render(request, 'tournament/tournament_content.html')

@login_required(login_url='/login/')
def lobby(request):
    return render(request, 'lobby/lobby.html')

@login_required(login_url='/login/')
def lobby_content(request):
    return render(request, 'lobby/lobby_content.html')
