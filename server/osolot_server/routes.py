from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from ninja import Router
from ninja.errors import HttpError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .schemas import (
    AccessTokenOut,
    LoginIn,
    RefreshIn,
    RegisterIn,
    TokenPairOut,
    UserOut,
    UserUpdateIn,
)
from .security import JWTAuth

User = get_user_model()

auth_router = Router()
users_router = Router()


def _user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        username=u.username,
        email=u.email or "",
        name=u.name or "",
    )


@auth_router.post("/register", response=TokenPairOut, tags=["auth"])
def register(request, data: RegisterIn):
    if User.objects.filter(username=data.username).exists():
        raise HttpError(400, "Username already taken.")
    try:
        user = User.objects.create_user(
            username=data.username,
            password=data.password,
            email=data.email or "",
            name=data.name or "",
        )
    except IntegrityError:
        raise HttpError(400, "Could not create user.") from None
    refresh = RefreshToken.for_user(user)
    return TokenPairOut(access=str(refresh.access_token), refresh=str(refresh))


@auth_router.post("/login", response=TokenPairOut, tags=["auth"])
def login(request, data: LoginIn):
    user = authenticate(request, username=data.username, password=data.password)
    if user is None:
        raise HttpError(401, "Invalid credentials.")
    if not user.is_active:
        raise HttpError(403, "User is inactive.")
    refresh = RefreshToken.for_user(user)
    return TokenPairOut(access=str(refresh.access_token), refresh=str(refresh))


@auth_router.post("/refresh", response=AccessTokenOut, tags=["auth"])
def refresh(request, data: RefreshIn):
    serializer = TokenRefreshSerializer(data={"refresh": data.refresh})
    if not serializer.is_valid():
        raise HttpError(401, "Invalid or expired refresh token.")
    access = serializer.validated_data["access"]
    return AccessTokenOut(access=access)


@users_router.get("/me", response=UserOut, auth=JWTAuth(), tags=["users"])
def me(request):
    return _user_out(request.auth)


@users_router.patch("/me", response=UserOut, auth=JWTAuth(), tags=["users"])
def update_me(request, data: UserUpdateIn):
    user: User = request.auth
    if data.name is not None:
        user.name = data.name
    user.save(update_fields=["name"])
    return _user_out(user)
