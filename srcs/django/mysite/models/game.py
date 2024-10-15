from django.db import models
from django.conf import settings


class Game(models.Model):
    name = models.CharField(max_length=255, verbose_name="Name of the Game")
    players = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='games', through='PlayerGameLink')
    is_active = models.BooleanField(default=True, verbose_name="Is Active?")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    def __str__(self):
        return self.name

    def add_player(self, user):
        """Add a player to the game."""
        if not self.is_active or self.players.count() >= 4:
            raise ValueError("Cannot add more players to this game.")
        PlayerGameLink.objects.create(player=user, game=self)

    def is_full(self):
        """Check if the game is full."""
        return self.players.count() >= 4

    def __str__(self):
        return self.name

class PlayerGameLink(models.Model):
    player = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    game = models.ForeignKey('mysite.Game', on_delete=models.CASCADE)
    team = models.IntegerField(default=1, verbose_name="Team Number")
    score = models.IntegerField(default=0, verbose_name="Score")

    class Meta:
        unique_together = (('player', 'game'),)
        verbose_name = "Player Game Link"
        verbose_name_plural = "Player Game Links"

    def __str__(self):
        return f'{self.player.get_short_name()} in game {self.game.name} (Team {self.team})'

