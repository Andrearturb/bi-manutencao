from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.chamado_importado import ChamadoImportado


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
        self.db.execute(delete(ChamadoImportado))

        for registro in registros:
            chamado = ChamadoImportado(
                upload_data=upload_data,
                nome_arquivo=nome_arquivo,
                **registro,
            )
            self.db.add(chamado)

        self.db.commit()

    def listar_todos(self) -> list[ChamadoImportado]:
        query = select(ChamadoImportado).order_by(ChamadoImportado.id.asc())
        return self.db.execute(query).scalars().all()