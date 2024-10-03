from django.contrib import admin
from django.urls import path
from . import views
from .controllers import *
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from two_factor.urls import urlpatterns as tf_urls

urlpatterns = [
    # old route 
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

    # connexion
    path('signup/', user_controller.signup, name='signup'),
    path('signin/', user_controller.signin, name='signin'),
    path('logout/', user_controller.logout_view, name='logout_view'),
    path('profile-edit-form/', user_controller.profile_edit_form, name='profile_edit_form'),

    # connexion api 42
    path('get-oth-autorization/', user_controller.get_oth_autorization, name='get_oth_autorization'),

    # 2fa
    path('account/', include(tf_urls)),
    path('get-qr-code/', user_controller.get_qr_code, name='get_qr_code'),
    path('check-qr-scanned/', user_controller.check_qr_scanned, name='check_qr_scanned'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
