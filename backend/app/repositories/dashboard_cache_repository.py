"""Repositório para cache de dados do dashboard."""

from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.dashboard_cache import DashboardCache


class DashboardCacheRepository:
    """Gerencia persistência e recuperação de cache do dashboard."""

    def __init__(self, db: Session) -> None:
        """Inicializa repositório com sessão de banco de dados."""
        self.db = db

    def salvar(
        self,
        nome_modulo: str,
        json_dados: dict,
        upload_data: datetime,
    ) -> None:
        """Substitui o cache de um módulo por dados mais recentes."""
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
        """Recupera dados em cache de um módulo específico."""
        query = select(DashboardCache).where(DashboardCache.nome_modulo == nome_modulo)
        resultado = self.db.execute(query).scalar_one_or_none()

        if resultado is None:
            return None

        return resultado.json_dados