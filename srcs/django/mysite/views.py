from django.shortcuts import render
from django.http import HttpResponse

def home(request):
	return HttpResponse("Bienvenue dans le site de cecile, ranki et mona dans un jolie container sur nginx et mariadb qui sert a rien pour l'instant")

def about(request):
    return render(request, 'about.html')