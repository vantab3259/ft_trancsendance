import jwt
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from mysite.models.user import CustomUser

class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header:
            token = auth_header.split(" ")[1]
            try:
                decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                request.user = CustomUser.objects.get(id=decoded['user_id'])
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expiré'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Token invalide'}, status=401)
        else:
            return JsonResponse({'error': 'Token manquant'}, status=401)
