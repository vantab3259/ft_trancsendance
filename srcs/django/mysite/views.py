from django.shortcuts import render
from django.http import HttpResponse

def home(request):
	return render(request, 'login/login.html')

def about(request):
    return render(request, 'about.html')