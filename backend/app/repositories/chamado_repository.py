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
        nome_arquivo: str,
        upload_data: datetime,
    ) -> None:
        self.db.execute(delete(ChamadoTratado))

        for registro in registros:
            chamado = ChamadoTratado(
                upload_data=upload_data,
                nome_arquivo=nome_arquivo,
                **registro,
            )
            self.db.add(chamado)

        self.db.commit()

    def listar_todos(self) -> list[ChamadoTratado]:
        query = select(ChamadoTratado).order_by(ChamadoTratado.id.asc())
        return self.db.execute(query).scalars().all()