from django.db import models
from django.conf import settings
from django.utils import timezone
from mysite.models.game import Game

class Tournament(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True, verbose_name="Is Active?")
    date_created = models.DateTimeField(default=timezone.now)
    date_finished = models.DateTimeField(null=True, blank=True, verbose_name="Date Finished")

    def start_next_round(self):
        current_round = self.rounds.last()
        if not current_round or current_round.matches.filter(winner__isnull=True).exists():
            raise ValueError("Current round not complete or does not exist.")

        winners = [match.winner for match in current_round.matches.all() if match.winner]
        if len(winners) == 1:
            self.is_active = False
            self.date_finished = timezone.now()
            self.save()
            return

        if len(winners) > 4:
            raise ValueError("Tournaments cannot have more than 4 players.")

        next_round = TournamentRound.objects.create(tournament=self, round_number=current_round.round_number + 1)
        for i in range(0, len(winners), 2):
            player1 = winners[i]
            player2 = winners[i + 1] if i + 1 < len(winners) else None
            game = Game.objects.create()
            TournamentMatch.objects.create(
                tournament_round=next_round,
                player1=player1,
                player2=player2,
                game=game
            )


    def __str__(self):
        return f"Tournament {self.name} (Active: {self.is_active})"


class TournamentRound(models.Model):
    tournament = models.ForeignKey(Tournament, related_name="rounds", on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField()
    date_started = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Round {self.round_number} of {self.tournament.name}"


class TournamentMatch(models.Model):
    tournament_round = models.ForeignKey(TournamentRound, related_name="matches", on_delete=models.CASCADE)
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="matches_as_player1"
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="matches_as_player2"
    )
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, related_name="won_matches", on_delete=models.SET_NULL)
    game = models.OneToOneField(Game, on_delete=models.CASCADE, null=True, blank=True)
    is_complete = models.BooleanField(default=False, verbose_name="Is Match Complete?")

    def finish_match(self, winner):
        """Mark the match as complete, set the winner, and update related game."""
        if winner not in [self.player1, self.player2]:
            raise ValueError("Winner must be one of the match participants.")
        
        self.winner = winner
        self.is_complete = True
        self.save()

        if self.game:
            self.game.finish_game()
            self.game.get_winner(reason="Tournament Match Win")

    def __str__(self):
        return f"Match between {self.player1} and {self.player2} in Round {self.tournament_round.round_number}"
