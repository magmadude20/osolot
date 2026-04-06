from ninja import Field, Schema


class RegisterIn(Schema):
    username: str = Field(..., min_length=1, max_length=150)
    password: str = Field(..., min_length=8)
    email: str | None = Field(None, max_length=254)
    name: str = Field("", max_length=255)


class LoginIn(Schema):
    username: str
    password: str


class RefreshIn(Schema):
    refresh: str


class TokenPairOut(Schema):
    access: str
    refresh: str


class AccessTokenOut(Schema):
    access: str


class UserOut(Schema):
    id: int
    username: str
    email: str
    name: str


class UserUpdateIn(Schema):
    name: str | None = Field(None, max_length=255)
