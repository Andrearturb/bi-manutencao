from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.dashboard_cache import DashboardCache


class DashboardCacheRepository:
    """Responsável por salvar e recuperar o cache do dashboard."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def salvar(
        self,
        nome_modulo: str,
        json_dados: dict,
        upload_data: datetime,
    ) -> None:
        self.db.execute(
            delete(DashboardCache).where(DashboardCache.nome_modulo == nome_modulo)
        )

        cache = DashboardCache(
            nome_modulo=nome_modulo,
            json_dados=json_dados,
            data_atualizacao=datetime.now(timezone.utc),
            upload_data=upload_data,
        )

        self.db.add(cache)
        self.db.commit()

    def obter_por_modulo(self, nome_modulo: str) -> dict | None:
        query = select(DashboardCache).where(DashboardCache.nome_modulo == nome_modulo)
        resultado = self.db.execute(query).scalar_one_or_none()

        if resultado is None:
            return None

        return resultado.json_dados