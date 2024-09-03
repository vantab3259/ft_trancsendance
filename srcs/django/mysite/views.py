from django.shortcuts import render
from django.http import HttpResponse

def home(request):
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