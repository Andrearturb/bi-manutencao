"""Rotas de suporte para inspeção rápida do estado do backend."""

from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.chamado_tratado import ChamadoTratado
from app.models.dashboard_cache import DashboardCache

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/contagem")
def debug_contagem() -> dict:
    """Retorna contagens úteis para verificar persistência e cache."""

    db: Session = SessionLocal()

    try:
        total_chamados = db.scalar(
            select(func.count()).select_from(ChamadoTratado)
        )
        total_cache = db.scalar(
            select(func.count()).select_from(DashboardCache)
        )
        cache_manutencao = db.scalar(
            select(DashboardCache).where(DashboardCache.nome_modulo == "manutencao")
        )
    finally:
        db.close()

    dados_tratados = 0
    upload_cache = None

    if cache_manutencao and isinstance(cache_manutencao.json_dados, dict):
        dados = cache_manutencao.json_dados.get("dados", [])
        dados_tratados = len(dados) if isinstance(dados, list) else 0
        upload_cache = cache_manutencao.json_dados.get("upload")

    return {
        "chamados_tratados": total_chamados or 0,
        "dashboard_cache": total_cache or 0,
        "dashboard_tratado_persistido": cache_manutencao is not None,
        "dados_tratados_no_cache": dados_tratados,
        "upload_cache": upload_cache,
    }