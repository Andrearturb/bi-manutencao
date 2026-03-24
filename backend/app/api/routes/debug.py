from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.chamado_importado import ChamadoImportado
from app.models.dashboard_cache import DashboardCache

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/contagem")
def debug_contagem() -> dict:
    db: Session = SessionLocal()

    try:
        total_chamados = db.scalar(
            select(func.count()).select_from(ChamadoImportado)
        )
        total_cache = db.scalar(
            select(func.count()).select_from(DashboardCache)
        )
    finally:
        db.close()

    return {
        "chamados_importados": total_chamados or 0,
        "dashboard_cache": total_cache or 0,
    }