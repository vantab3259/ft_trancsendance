from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from mysite.models.chat import ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

@login_required
def get_messages(request, id):
    try:
        user = request.user
        recipient = User.objects.get(id=id)

        # Récupérer les 30 derniers messages entre les deux utilisateurs
        messages = ChatMessage.objects.filter(
            Q(sender=user, recipient=recipient) | Q(sender=recipient, recipient=user)
        ).order_by('-timestamp')[:30]

        messages = reversed(messages)

        # Préparer les données à retourner
        messages_data = [
            {
                "content": msg.message,
                "timestamp": msg.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "sender_id": msg.sender.id,
                "sender_name": msg.sender.get_short_name(),
                "sender_image": msg.sender.get_profile_picture_url(),
            }
            for msg in messages
        ]

        return JsonResponse({"messages": messages_data}, safe=False)
    
    except ObjectDoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
