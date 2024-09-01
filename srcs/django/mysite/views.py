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