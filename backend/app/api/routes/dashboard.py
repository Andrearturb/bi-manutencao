from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.repositories.dashboard_cache_repository import DashboardCacheRepository
from app.schemas.dashboard import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/manutencao", response_model=DashboardResponse)
def get_dashboard_manutencao() -> DashboardResponse:
    db: Session = SessionLocal()

    try:
        cache_repository = DashboardCacheRepository(db)
        cache = cache_repository.obter_por_modulo("manutencao")

        if cache is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Dashboard tratado ainda nao foi persistido. "
                    "Execute a importacao para gerar o cache."
                ),
            )

        return DashboardResponse(**cache)

    finally:
        db.close()