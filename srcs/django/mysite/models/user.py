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

class CustomUserManager(BaseUserManager):
    def get_by_natural_key(self, email):
        return self.get(email=email)

class CustomUser(AbstractBaseUser, PermissionsMixin):
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

    access_token = models.CharField(_('access_token'), blank=True)
    access_code = models.CharField(_('access_code'), blank=True)

    coalition_color = models.CharField(_('coalition_color'), blank=True)
    coalition_cover_url = models.CharField(_('coalition_cover_url'), blank=True)
    coalition_image_url = models.CharField(_('coalition_image_url'), blank=True)
    coalition_name = models.CharField(_('coalition_name'), blank=True)
    coalition_slug = models.CharField(_('coalition_slug'), blank=True)
    coalition_id = models.CharField(_('coalition_id'), blank=True)

    two_fa_code = models.CharField(max_length=6, blank=True, verbose_name=_('Two Factor Code'))
    last_two_fa_code = models.DateTimeField(auto_now=True, verbose_name=_('Last Two Factor Code'))
    two_fa_code_is_active = models.BooleanField(_('active'), default=False)
    two_fa_code_is_checked = models.BooleanField(_('active'), default=False)





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
