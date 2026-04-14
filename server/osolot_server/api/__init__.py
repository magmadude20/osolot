from ninja import NinjaAPI

from .auth import auth_router
from .collective_memberships import collective_memberships_router
from .collectives import collectives_router
from .users import users_router

api = NinjaAPI(
    title="Osolot API",
    version="0.0.1",
    description="API for managing decentralized libraries of things.",
    urls_namespace="api",
)

api.add_router("/auth", auth_router)
api.add_router("/users", users_router)
api.add_router("/collectives", collectives_router)
api.add_router("/collectives", collective_memberships_router)

__all__ = ["api"]
