import logging
import random
import time

from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Q
from django.utils.http import urlsafe_base64_decode
from ninja import Router
from ninja.errors import HttpError
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from ..api_builders.exceptions import validation_error_to_http_error

from ..email.auth_emails import (
    send_password_reset_email,
    send_verification_email,
    token_generator,
)
from ..security import JWTAuth
from .schemas import (
    AccessTokenOut,
    VerifyEmailConfirmIn,
    VerifyEmailRequestIn,
    LoginIn,
    MessageOut,
    PasswordResetConfirmIn,
    PasswordResetRequestIn,
    RefreshIn,
    RegisterIn,
    TokenPairOut,
)

logger = logging.getLogger(__name__)

User = get_user_model()

auth_router = Router()


# Register / login


@auth_router.post("/register", response=TokenPairOut, tags=["auth"])
def register(request, data: RegisterIn):
    email = (data.email or "").strip()
    username = (data.username or "").strip()
    if not email or not username:
        raise HttpError(400, "Email and username are required.")

    if User.objects.filter(
        Q(email__iexact=email) | Q(username__iexact=username)
    ).exists():
        raise HttpError(400, "An account with this email or username already exists.")

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=data.password,
            first_name=data.first_name or "",
            last_name=data.last_name or "",
        )
    except ValidationError as e:
        raise validation_error_to_http_error(e) from None
    except IntegrityError:
        raise HttpError(400, "Could not create user.") from None

    refresh = RefreshToken.for_user(user)
    return TokenPairOut(access=str(refresh.access_token), refresh=str(refresh))


@auth_router.post("/login", response=TokenPairOut, tags=["auth"])
def login(request, data: LoginIn):
    user = authenticate(
        request,
        username=data.identifier.strip(),
        password=data.password,
    )
    if user is None:
        raise HttpError(401, "Invalid credentials.")
    if not user.is_active:
        raise HttpError(403, "User is inactive.")
    refresh = RefreshToken.for_user(user)
    return TokenPairOut(access=str(refresh.access_token), refresh=str(refresh))


@auth_router.post("/refresh", response=AccessTokenOut, tags=["auth"])
def refresh(request, data: RefreshIn):
    serializer = TokenRefreshSerializer(data={"refresh": data.refresh})

    # TokenRefreshSerializer can throw AuthenticationFailed(), which isn't handled
    # by serializer.is_valid(), even when raise_exception is Flase (which is the
    # default). This seems wrong imo, but that's why we're handling both the exception
    # and the not-valid cases.
    try:
        serializer_validated = serializer.is_valid()
    except Exception:
        serializer_validated = False

    if not serializer_validated:
        raise HttpError(401, "Invalid or expired refresh token.")

    access = serializer.validated_data["access"]
    return AccessTokenOut(access=access)


# Password reset


@auth_router.post(
    "/password-reset/request",
    response=MessageOut,
    tags=["auth"],
)
def password_reset_request(request, data: PasswordResetRequestIn):
    msg = "If an account exists for this email, we sent password reset instructions."
    email = data.email.strip()
    if email:
        user = User.objects.filter(email__iexact=email).first()
        if user is not None and user.is_active and user.email:
            try:
                send_password_reset_email(user)
            except Exception:
                logger.exception("password reset email failed")

    # To prevent timing attacks, add jitter to the response time.
    # This has a secondary benefit of slowing down a brute force attack, but
    # throttling should already be preventing that.
    # Note: intentionally slowing the server down could obviously cause issues, 
    # especially if each request is handled synchronously.
    max_jitter_seconds = 1
    time.sleep(random.random() * max_jitter_seconds)

    return MessageOut(message=msg)


@auth_router.post(
    "/password-reset/confirm",
    response=MessageOut,
    tags=["auth"],
)
def password_reset_confirm(request, data: PasswordResetConfirmIn):
    try:
        uid_bytes = urlsafe_base64_decode(data.uid)
        user_id = int(uid_bytes.decode())
        user = User.objects.get(pk=user_id)
    except (User.DoesNotExist, ValueError, UnicodeDecodeError, UnicodeError):
        raise HttpError(400, "Invalid or expired reset link.") from None
    if not token_generator.check_token(user, data.token):
        raise HttpError(400, "Invalid or expired reset link.")
    user.set_password(data.new_password)
    user.save()
    return MessageOut(message="Your password has been reset. You can log in now.")


# Email verification


@auth_router.post(
    "/verify-email/request",
    response=MessageOut,
    auth=JWTAuth(),
    tags=["auth"],
)
def email_verification_request(request, data: VerifyEmailRequestIn):
    user: User = request.auth
    if user is None:
        raise HttpError(401, "Invalid credentials.")
    if not user.is_active:
        raise HttpError(403, "User is inactive.")
    if user.email_verified:
        return MessageOut(message="Your email is already verified!")

    try:
        send_verification_email(user)
    except Exception:
        logger.exception("email verification send failed")
        return MessageOut(message="Failed to send verification email :(")

    return MessageOut(message="Verification email sent. Please check your inbox.")


@auth_router.post(
    "/verify-email/confirm",
    response=MessageOut,
    tags=["auth"],
)
def email_verification_confirm(request, data: VerifyEmailConfirmIn):
    try:
        uid_bytes = urlsafe_base64_decode(data.uid)
        user_id = int(uid_bytes.decode())
        user = User.objects.get(pk=user_id)
    except (User.DoesNotExist, ValueError, UnicodeDecodeError, UnicodeError):
        raise HttpError(400, "Invalid or expired verification link.") from None
    if not token_generator.check_token(user, data.token):
        raise HttpError(400, "Invalid or expired verification link.")
    user.email_verified = True
    user.save(update_fields=["email_verified"])
    return MessageOut(message="Your email has been verified!")
