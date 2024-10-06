from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required

from django.shortcuts import redirect
from functools import wraps
from urllib.parse import urlencode

def not_logged_in_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.two_fa_code_is_checked:
            return redirect('/dashboard/')
        return view_func(request, *args, **kwargs)
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
