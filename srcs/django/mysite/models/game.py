from django.db import models
from django.conf import settings
from django.utils import timezone


class Game(models.Model):
    players = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='games', through='PlayerGameLink')
    is_active = models.BooleanField(default=True, verbose_name="Is Active?")
    date_created = models.DateTimeField(default=timezone.now)
    date_finish = models.DateTimeField(null=True, blank=True, verbose_name="Date Finished")

    def add_player(self, user):
        """Add a player to the game."""
        if not self.is_active or self.players.count() >= 2:
            raise ValueError("Cannot add more players to this game.")
        PlayerGameLink.objects.create(player=user, game=self)

    def is_full(self):
        """Check if the game is full."""
        return self.players.count() >= 2

    def get_winner(self, reason=None):
        """Determine the winner of the game based on the highest score."""
        winner_link = PlayerGameLink.objects.filter(game=self).order_by('-score').first()
        if winner_link:
            winner_link.is_winner = True  # Marquer le joueur gagnant
            winner_link.reason = reason if reason else "Highest score"  # Ajouter la raison
            winner_link.save()  # Enregistrer le changement

            # Marquer le jeu comme terminé et ajouter la date de fin
            self.is_active = False
            self.date_finish = timezone.now()  # Ajouter la date de fin
            self.save()  # Enregistrer le changement dans la base de données
        return winner_link.player if winner_link else None

    def __str__(self):
        return f"Game {self.id}"

    def finish_game(self):
        """Set the finish date of the game when it's completed."""
        self.date_finish = timezone.now()
        self.save()


class PlayerGameLink(models.Model):
    player = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    team = models.IntegerField(default=1, verbose_name="Team Number")
    score = models.IntegerField(default=0, verbose_name="Score")
    is_winner = models.BooleanField(default=False, verbose_name="Is Winner")
    reason = models.CharField(max_length=255, blank=True, verbose_name="Reason")

    class Meta:
        unique_together = (('player', 'game'),)
        verbose_name = "Player Game Link"
        verbose_name_plural = "Player Game Links"

    def __str__(self):
        return f'{self.player.get_short_name()} in game {self.game.id} (Team {self.team})'
