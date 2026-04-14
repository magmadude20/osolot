from django.contrib.auth import get_user_model
from ninja import Router

from .schemas import UpdateProfileRequest, UserProfile
from ..security import JWTAuth

User = get_user_model()

users_router = Router()


def _user_profile_out(u: User) -> UserProfile:
    return UserProfile(
        id=u.id,
        email=u.email or "",
        email_verified=u.email_verified,
        first_name=u.first_name or "",
        last_name=u.last_name or "",
    )


@users_router.get("/me", response=UserProfile, auth=JWTAuth(), tags=["users"])
def me(request):
    return _user_profile_out(request.auth)


@users_router.patch("/me", response=UserProfile, auth=JWTAuth(), tags=["users"])
def update_me(request, data: UpdateProfileRequest):
    user: User = request.auth
    update_fields: list[str] = []
    if data.first_name is not None:
        user.first_name = data.first_name
        update_fields.append("first_name")
    if data.last_name is not None:
        user.last_name = data.last_name
        update_fields.append("last_name")
    if update_fields:
        user.save(update_fields=update_fields)
    return _user_profile_out(user)
