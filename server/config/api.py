from ninja import NinjaAPI

from osolot_server.routes import auth_router, users_router

api = NinjaAPI(
    title="Osolot API",
    version="0.0.1",
    description="API for managing decentralized libraries of things.",
    urls_namespace="api",
)

api.add_router("/auth", auth_router)
api.add_router("/users", users_router)
