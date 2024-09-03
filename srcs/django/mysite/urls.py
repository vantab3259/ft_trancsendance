"""
URL configuration for mysite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('dashboard_content/', views.dashboard_content, name='dashboard_content'),
    path('home_content/', views.home_content, name='home_content'),
    path('pong/', views.pong, name='pong'),
    path('pong_content/', views.pong_content, name='pong_content'),
    path('profile/edit', views.profile_edit, name='profile_edit'),
    path('profile_edit', views.profile_edit, name='profile_edit'),
    path('profile_edit_content', views.profile_edit_content, name='profile_edit'),

]
