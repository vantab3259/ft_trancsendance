from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mysite.models import CustomUser


@csrf_exempt
def signup(request):

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