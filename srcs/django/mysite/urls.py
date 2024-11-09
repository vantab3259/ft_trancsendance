from django.contrib import admin
from django.urls import path
from . import views
from .controllers import *
from .controllers import chat_controller
from .controllers import tournament_controller
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.base, name='home'),
    path('base/', views.base, name='base'),
    path('home/', views.base, name='home'),
    path('about/', views.base, name='about'),
    path('dashboard/', views.base, name='dashboard'),
    path('dashboard_content/', views.base, name='dashboard_content'),
    path('home_content/', views.base, name='home_content'),
    path('pong/', views.base, name='pong'),
    path('pong_content/', views.base, name='pong_content'),
    path('profile/edit', views.base, name='profile_edit'),
    path('profile_edit_content', views.base, name='profile_edit'),
    path('profile/profile_edit_content', views.base, name='profile_edit'),
    path('ranking', views.base, name='ranking'),
    path('ranking_content', views.base, name='ranking_content'),
    path('history', views.base, name='history_match'),
    path('history_match_content', views.base, name='history_match_content'),
    path('history_content', views.base, name='history_match_content'),
    path('tournament', views.base, name='tournament'),
    path('tournament_content', views.base, name='tournament_content'),
    path('lobby', views.base, name='lobby'),
    path('login/', views.login, name='login'),
    path('lobby_content', views.base, name='lobby_content'),
    path('pong-online/', views.base, name='pong_online'),
    path('chat/', views.base, name='chat'),

    path('signup/', user_controller.signup, name='signup'),
    path('signin/', user_controller.signin, name='signin'),
    path('logout/', user_controller.logout_view, name='logout_view'),
    path('profile-edit-form/', user_controller.profile_edit_form, name='profile_edit_form'),
    path('get-oth-autorization/', user_controller.get_oth_autorization, name='get_oth_autorization'),

    path('set-two-fa-code/', user_controller.set_two_fa_code, name='set_two_fa_code'),
    path('check-two-fa-code/', user_controller.check_two_fa_code, name='check_two_fa_code'),

    path('search-users/', user_controller.search_users, name='search_users'),
    path('request-friend/', user_controller.request_friend, name='request_friend'),
    path('update-online-status/', user_controller.update_online_status, name='update_online_status'),

    path('chat/messages/<int:id>/', chat_controller.get_messages, name='get_messages'),

    path('get-ranking/', user_controller.getRanking, name='getRanking'),
    path('get-history-game/', user_controller.get_history_game, name='get_history_game'),

    path('tournament/create/', tournament_controller.create_tournament, name='create_tournament'),
    path('tournament/<int:tournament_id>/join/', tournament_controller.join_tournament, name='join_tournament'),
    path('tournament/<int:tournament_id>/start-next-round/', tournament_controller.start_next_round, name='start_next_round'),
    path('tournament/match/<int:match_id>/finish/', tournament_controller.finish_match, name='finish_match'),
    path('tournament/<int:tournament_id>/details/', tournament_controller.tournament_details, name='tournament_details'),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
