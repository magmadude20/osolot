from django.contrib.auth import get_user_model
from ninja.security import HttpBearer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class JWTAuth(HttpBearer):
    """Validates Bearer JWT using djangorestframework-simplejwt."""

    def authenticate(self, request, token: str):
        if not token:
            return None
        try:
            access = AccessToken(token)
            user_id = access["user_id"]
        except (TokenError, InvalidToken, KeyError):
            return None
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
