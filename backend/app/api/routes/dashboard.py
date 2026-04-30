from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedUser, require_authenticated_user
from app.db.session import SessionLocal
from app.repositories.dashboard_cache_repository import DashboardCacheRepository
from app.schemas.dashboard import DashboardCustosResponse, DashboardManutencaoResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/manutencao", response_model=DashboardManutencaoResponse)
def get_dashboard_manutencao(
    _: AuthenticatedUser = Depends(require_authenticated_user),
) -> DashboardManutencaoResponse:
    db: Session = SessionLocal()

    try:
        cache_repository = DashboardCacheRepository(db)
        cache_corretiva = cache_repository.obter_por_modulo("manutencao_corretiva")
        cache_preventiva = cache_repository.obter_por_modulo("manutencao_preventiva")

        cache_corretiva = cache_corretiva or _payload_vazio()
        cache_preventiva = cache_preventiva or _payload_vazio()

        return DashboardManutencaoResponse(
            dadosCorretivas=cache_corretiva["dados"],
            dadosPreventivas=cache_preventiva["dados"],
            uploadCorretivas=cache_corretiva["upload"],
            uploadPreventivas=cache_preventiva["upload"],
        )
    finally:
        db.close()


@router.get("/custos", response_model=DashboardCustosResponse)
def get_dashboard_custos(
    _: AuthenticatedUser = Depends(require_authenticated_user),
) -> DashboardCustosResponse:
    db: Session = SessionLocal()

    try:
        cache_repository = DashboardCacheRepository(db)
        cache_custos = cache_repository.obter_por_modulo("custos")
        cache_custos = cache_custos or _payload_vazio_custos()

        dados = cache_custos.get("dadosCustos")
        if dados is None:
            dados = cache_custos.get("dados", [])

        upload = cache_custos.get("uploadCustos")
        if upload is None:
            upload = cache_custos.get("upload", _payload_vazio_custos()["uploadCustos"])

        return DashboardCustosResponse(
            dadosCustos=dados,
            uploadCustos=upload,
        )
    finally:
        db.close()


def _payload_vazio() -> dict:
    return {
        "dados": [],
        "upload": {
            "uploadData": None,
            "nomeArquivo": None,
            "totalRegistros": 0,
        },
    }


def _payload_vazio_custos() -> dict:
    return {
        "dadosCustos": [],
        "uploadCustos": {
            "uploadData": None,
            "nomeArquivo": None,
            "totalRegistros": 0,
        },
    }