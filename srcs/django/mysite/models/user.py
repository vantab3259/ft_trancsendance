from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
import os
import random
import uuid
from django.conf import settings
from shutil import copyfile
import json
from django.core.serializers import serialize
from django.db.models import Count, Q
from django.shortcuts import render
from django.contrib.postgres.fields import ArrayField
from django.db import models
from mysite.models.game import Game, PlayerGameLink
import logging

class CustomUserManager(BaseUserManager):
    def get_by_natural_key(self, email):
        return self.get(email=email)

    def search_by_pseudo_or_email(self, query, user, mode):
        if not query:
            users = self.all()
        else:
            users = self.filter(Q(pseudo__icontains=query) | Q(email__icontains=query))

        if mode == 'add':
            users = users.exclude(id__in=user.friends.all())
            users = users.exclude(id__in=user.friends_request.all())
            users = users.exclude(id__in=user.friends_send_request.all())
        elif mode == 'friends':
            users = users.filter(id__in=user.friends.all())
        elif mode == 'pending':
            users = users.filter(id__in=user.friends_request.all())


        return users.distinct()[:30]
    
    def search_by_id(self, id):
        if not id:
            return None
        user = self.get(Q(id=id))
        return user
  

        


class CustomUser(AbstractBaseUser, PermissionsMixin):

    # core
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=30, blank=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=True)
    pseudo = models.CharField(_('pseudo'), max_length=30, blank=True)
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    is_active = models.BooleanField(_('active'), default=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True, default='')
    phone_number = models.CharField(_('phone_number'), max_length=30, blank=True)
    birth_city = models.CharField(_('birth_city'), blank=True)
    birth_date = models.DateField(_('birth_date'), null=True, blank=True)

    # module api
    access_token = models.CharField(_('access_token'), blank=True)
    access_code = models.CharField(_('access_code'), blank=True)

    coalition_color = models.CharField(_('coalition_color'), blank=True)
    coalition_cover_url = models.CharField(_('coalition_cover_url'), blank=True)
    coalition_image_url = models.CharField(_('coalition_image_url'), blank=True)
    coalition_name = models.CharField(_('coalition_name'), blank=True)
    coalition_slug = models.CharField(_('coalition_slug'), blank=True)
    coalition_id = models.CharField(_('coalition_id'), blank=True)

    # module 2fa
    two_fa_code = models.CharField(max_length=6, blank=True, verbose_name=_('Two Factor Code'))
    last_two_fa_code = models.DateTimeField(auto_now=True, verbose_name=_('Last Two Factor Code'))
    two_fa_code_is_active = models.BooleanField(_('active'), default=False)
    two_fa_code_is_checked = models.BooleanField(_('active'), default=False)

    #module friends
    friends = models.ManyToManyField(
        'self',
        symmetrical=True,
        blank=True
    )

    friends_request = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='received_requests',
        blank=True
    )

    friends_send_request = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='sent_requests',
        blank=True
    )

    # module jwt
    active_tokens = ArrayField(
        models.CharField(max_length=255, blank=True),
        default=list,
        blank=True,
        verbose_name='Active Tokens'
    )

    #status online
    is_online = models.BooleanField(_('active'), default=False)
    last_time_check_is_online = models.DateTimeField(auto_now=True)

    
    
    blocked_list = ArrayField(
        models.IntegerField(blank=True),
        default=list,
        blank=True,
        verbose_name='Blocked List'
    )



    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def get_short_name(self):
        return self.first_name

    def email_user(self, subject, message, from_email=None, **kwargs):
        """
        Envoie un e-mail à cet utilisateur.
        """
        from django.core.mail import send_mail
        send_mail(subject, message, from_email, [self.email], **kwargs)

    def save(self, *args, **kwargs):
        if not self.profile_picture:
            self.profile_picture = self.create_unique_profile_picture()

        super().save(*args, **kwargs)

    def create_unique_profile_picture(self):
        # Sélectionne un avatar par défaut
        avatar_path = self.get_random_default_avatar()

        # Génère un nom de fichier unique
        unique_filename = f'{uuid.uuid4()}.svg'

        # Chemin absolu du répertoire media et profile_pics
        media_dir = '/usr/src/app/media'
        profile_pics_dir = os.path.join(media_dir, 'profile_pics')

        # Vérifie si le répertoire media existe, sinon le créer
        if not os.path.exists(media_dir):
            os.makedirs(media_dir)

        # Vérifie si le répertoire profile_pics existe, sinon le créer
        if not os.path.exists(profile_pics_dir):
            os.makedirs(profile_pics_dir)

        # Définir le chemin final dans le dossier 'media/profile_pics/'
        final_path = os.path.join(settings.MEDIA_ROOT, 'profile_pics', unique_filename)

        # Chemin complet de l'avatar statique (en dur)
        avatar_full_path = os.path.join('/usr/src/app/mysite/static/images/avatar/', avatar_path.split('/')[-1])

        # Vérifie si le fichier existe avant de copier
        if not os.path.exists(avatar_full_path):
            raise FileNotFoundError(f"L'avatar {avatar_full_path} n'existe pas.")

        # Copier l'avatar par défaut dans le dossier des photos de profil
        copyfile(avatar_full_path, final_path)

        # Retourner le chemin relatif à MEDIA_ROOT pour l'attribuer à 'profile_picture'
        return f'profile_pics/{unique_filename}'


    def get_random_default_avatar(self):
        avatars = [f'avatar_{i}.svg' for i in range(1, 46)]
        return f'/static/images/avatar/{random.choice(avatars)}'

    def get_profile_picture_url(self):
        if self.profile_picture:
            return self.profile_picture.url
        else:
            return self.get_random_default_avatar()

    def getJson(self):
        return json.loads(serialize('json', [self]))

    def is_blocked_by(self, other_user):
        """Check if the user is blocked by another user."""
        return UserBlock.objects.filter(blocker=other_user, blocked=self).exists()

    def has_blocked(self, other_user):
        """Check if the user has blocked another user."""
        return UserBlock.objects.filter(blocker=self, blocked=other_user).exists()

    def can_message(self, other_user):
        """Check if the user can send messages to the other user (not blocked)."""
        return not self.has_blocked(other_user) and not self.is_blocked_by(other_user)

    def send_game_invite(self, recipient, game):
        """Send a game invite to another user."""
        if self == recipient:
            raise ValueError("Cannot invite yourself to a game.")
        if self.can_message(recipient):
            invite = GameInvite.objects.create(sender=self, recipient=recipient, game=game)
            return invite
        else:
            raise PermissionError("You cannot invite this user to a game.")
        
    def getHistoryGame(self):
        # Récupérer tous les liens de jeux pour cet utilisateur
        games = PlayerGameLink.objects.filter(player=self).select_related('game')
        
        # Transformer ces objets en une structure de données utile
        game_history = []
        for game_link in games:
            opponent = PlayerGameLink.objects.filter(game=game_link.game).exclude(player=self).first()  # Récupère l'opposant

            # Calculer la durée du jeu si cette info est disponible
            if game_link.game.date_created and game_link.game.date_finish:
                duration = game_link.game.date_finish - game_link.game.date_created
                duration_in_seconds = duration.total_seconds()
                minutes, seconds = divmod(duration_in_seconds, 60)
                duration_str = f"{int(minutes)}min {int(seconds)}s"
            else:
                duration_str = "N/A"

            # Déterminer si c'est une victoire ou une défaite
            result = "match-victory" if game_link.is_winner else "match-defeat"

            game_history.append({
                'opponent_name': opponent.player.pseudo if opponent else "Unknown",
                'opponent_image': opponent.player.get_profile_picture_url(),
                'date': game_link.game.date_created.strftime("%Y-%m-%d") if game_link.game.date_created else "Unknown",
                'score': f"{game_link.score}-{opponent.score if opponent else 0}",
                'duration': duration_str,
                'result': result
            })
        
        return game_history
    
    def getRanking(self):
        # Récupérer tous les utilisateurs avec leur nombre de victoires et de titres
        ranking = (
            CustomUser.objects.annotate(
                matches_won=Count(
                    'playergamelink',
                    filter=Q(playergamelink__is_winner=True)
                ),
                titles_won=Count(
                    'playergamelink',
                    filter=Q(playergamelink__is_winner=True, playergamelink__reason__icontains="Title")
                )
            )
            .order_by('-matches_won', '-titles_won')
        )

        # Transformer ces objets en une structure de données utile
        leaderboard = []
        for position, player in enumerate(ranking, start=1):
            leaderboard.append({
                'position': position,
                'id': player.id,
                'name': f"{player.first_name} {player.last_name}",
                'pseudo': player.pseudo,
                'profile_picture_url': player.get_profile_picture_url(),
                'matches_won': player.matches_won,
                'titles_won': player.titles_won
            })

        return leaderboard


