from django.contrib.auth import get_user_model
from django.http import HttpRequest
from ninja.security import HttpBearer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


def get_optional_user(request: HttpRequest) -> User | None:
    """Returns the user if a valid Bearer JWT is present; otherwise None."""
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth[7:].strip()
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
