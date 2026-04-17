import logging
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

logger = logging.getLogger(__name__)


class EmailOrUsernameBackend(ModelBackend):
    """
    Authenticate with USERNAME_FIELD (username), or with email when the
    lookup string contains '@'.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        UserModel = get_user_model()
        key = (username or "").strip()
        if not key:
            return None
        try:
            # Emails MUST have @, usernames MUST NOT have @
            # This is enforced at the database level, so it's safe to use @ to
            # determine which field to query.
            if "@" in key:
                user = UserModel.objects.get(email__iexact=key)
            else:
                user = UserModel.objects.get(username__iexact=key)
        except UserModel.DoesNotExist:
            return None
        except UserModel.MultipleObjectsReturned:
            # YIKES
            logger.error(f"Multiple users found for username or email: {key}!!")
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
