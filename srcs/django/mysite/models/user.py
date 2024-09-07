from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=30, blank=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=True)
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    is_active = models.BooleanField(_('active'), default=True)
    is_active_2 = models.BooleanField(_('active'), default=True)

    # USERNAME_FIELD indique à Django quel champ utiliser pour identifier les utilisateurs
    USERNAME_FIELD = 'email'
    
    # REQUIRED_FIELDS sont les champs obligatoires lors de la création d'un superuser
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
