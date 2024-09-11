import os
import random

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

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
    birth_date= models.DateTimeField(_('birth_date'), null=True, blank=True)


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
            self.profile_picture = self.get_random_default_avatar()

        super().save(*args, **kwargs)

    def get_random_default_avatar(self):
        avatars = [f'avatar_{i}.svg' for i in range(1, 46)]
        return f'/static/images/avatar/{random.choice(avatars)}'

    def get_profile_picture_url(self):
        if self.profile_picture:
            return self.profile_picture.url
        else:
            return self.get_random_default_avatar()
