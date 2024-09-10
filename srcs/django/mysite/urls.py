from django.contrib import admin
from django.urls import path
from . import views
from .controllers import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.dashboard, name='home'),
    path('home/', views.dashboard, name='home'),
    path('about/', views.about, name='about'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('dashboard_content/', views.dashboard_content, name='dashboard_content'),
    path('home_content/', views.dashboard_content, name='home_content'),
    path('pong/', views.pong, name='pong'),
    path('pong_content/', views.pong_content, name='pong_content'),
    path('profile/edit', views.profile_edit, name='profile_edit'),
    path('profile_edit_content', views.profile_edit_content, name='profile_edit'),
    path('profile/profile_edit_content', views.profile_edit_content, name='profile_edit'),
    path('ranking', views.ranking, name='ranking'),
    path('ranking_content', views.ranking_content, name='ranking_content'),
    path('history', views.history_match, name='history_match'),
    path('history_match_content', views.history_match_content, name='history_match_content'),
    path('history_content', views.history_match_content, name='history_match_content'),
    path('tournament', views.tournament, name='tournament'),
    path('tournament_content', views.tournament_content, name='tournament_content'),
    path('lobby', views.lobby, name='lobby'),
    path('login', views.login, name='login'),
    path('lobby_content', views.lobby_content, name='lobby_content'),
    path('signup/', user_controller.signup, name='signup'),

]
