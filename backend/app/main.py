"""Ponto de entrada da aplicação FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.init_db import init_db


def create_application() -> FastAPI:
    """Constrói e configura a instância da aplicação FastAPI."""
    application = FastAPI(title=settings.app_name, version=settings.app_version)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.on_event("startup")
    def on_startup() -> None:
        """Inicializa estruturas de banco de dados antes de atender requisições."""
        init_db()

    application.include_router(api_router)
    return application


app = create_application()
