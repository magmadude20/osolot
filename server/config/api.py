from ninja import NinjaAPI

from users.routes import auth_router, users_router

api = NinjaAPI(
    title="Osolot API",
    version="1.0.0",
    description="Account and profile endpoints (JWT).",
    urls_namespace="api",
)

api.add_router("/auth", auth_router)
api.add_router("/users", users_router)
