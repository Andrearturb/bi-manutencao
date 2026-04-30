from datetime import datetime

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.custo_tratado import CustoTratado


class CustoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def substituir_todos(
        self,
        registros: list[dict],
        nome_arquivo: str,
        upload_data: datetime,
    ) -> None:
        self.db.execute(delete(CustoTratado))

        for registro in registros:
            custo = CustoTratado(
                upload_data=upload_data,
                nome_arquivo=nome_arquivo,
                **registro,
            )
            self.db.add(custo)

        self.db.commit()
