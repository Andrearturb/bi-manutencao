"""Módulo de composição de rotas da API."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.debug import router as debug_router
from app.api.routes.health import router as health_router
from app.api.routes.importacao import router as importacao_router
from app.api.routes.referencias import router as referencias_router


def _register_routes(router: APIRouter) -> None:
    """Registra todos os grupos de rotas em um único lugar."""
    router.include_router(health_router)
    router.include_router(auth_router)
    router.include_router(importacao_router)
    router.include_router(dashboard_router)
    router.include_router(debug_router)
    router.include_router(referencias_router)


api_router = APIRouter()
_register_routes(api_router)
