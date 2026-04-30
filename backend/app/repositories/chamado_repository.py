from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.chamado_tratado import ChamadoTratado


class ChamadoRepository:
    """Responsável pelas operações de persistência dos chamados."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def substituir_todos(
        self,
        registros: list[dict],
        tipo_manutencao: str,
        nome_arquivo: str,
        upload_data: datetime,
    ) -> None:
        self.db.execute(
            delete(ChamadoTratado).where(
                ChamadoTratado.tipo_manutencao == tipo_manutencao
            )
        )

        for registro in registros:
            chamado = ChamadoTratado(
                upload_data=upload_data,
                nome_arquivo=nome_arquivo,
                tipo_manutencao=tipo_manutencao,
                **registro,
            )
            self.db.add(chamado)

        self.db.commit()

    def listar_todos(self, tipo_manutencao: str | None = None) -> list[ChamadoTratado]:
        query = select(ChamadoTratado)
        if tipo_manutencao is not None:
            query = query.where(ChamadoTratado.tipo_manutencao == tipo_manutencao)

        query = query.order_by(ChamadoTratado.id.asc())
        return self.db.execute(query).scalars().all()