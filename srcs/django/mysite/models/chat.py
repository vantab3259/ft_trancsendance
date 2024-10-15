from django.db import models
from django.conf import settings
from django.utils import timezone

class ChatMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_messages', on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_game_invite = models.BooleanField(default=False)

    def __str__(self):
        return f"From {self.sender.get_short_name()} to {self.recipient.get_short_name()} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

class UserBlock(models.Model):
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='blocker_relations', on_delete=models.CASCADE)
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='blocked_relations', on_delete=models.CASCADE)
    blocked_on = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = (('blocker', 'blocked'),)

    def __str__(self):
        return f"{self.blocker.get_short_name()} blocked {self.blocked.get_short_name()}"

class GameInvite(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='game_invitations_sent', on_delete=models.CASCADE)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='game_invitations_received', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending')
    sent_on = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Invite from {self.sender.get_short_name()} to {self.recipient.get_short_name()} for {self.game.name} ({self.status})"

