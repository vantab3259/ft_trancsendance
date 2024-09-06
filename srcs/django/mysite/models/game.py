from django.db import models

class Game(models.Model):
    nom = models.CharField(max_length=255)
    REQUIRED_FIELDS = []
    def __str__(self):
            return self.nom
