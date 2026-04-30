from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.loja_referencia import LojaReferencia


class LojaReferenciaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def substituir_todas(self, registros: list[dict]) -> None:
        self.db.execute(delete(LojaReferencia))

        for registro in registros:
            loja = LojaReferencia(
                sap=registro["sap"],
                nome_loja=registro["nome_loja"],
                praca=registro.get("praca"),
                cnpj_loja=registro.get("cnpj_loja"),
                ativo=registro.get("ativo", True),
                data_atualizacao=datetime.utcnow(),
            )
            self.db.add(loja)

        self.db.commit()

    def obter_por_sap(self, sap: str) -> LojaReferencia | None:
        statement = select(LojaReferencia).where(LojaReferencia.sap == sap)
        return self.db.execute(statement).scalar_one_or_none()

    def obter_por_saps(self, saps: list[str]) -> dict[str, LojaReferencia]:
        if not saps:
            return {}

        statement = select(LojaReferencia).where(LojaReferencia.sap.in_(saps))
        lojas = list(self.db.scalars(statement).all())
        return {loja.sap: loja for loja in lojas}

    def listar_todas(self) -> list[LojaReferencia]:
        statement = select(LojaReferencia).order_by(LojaReferencia.nome_loja.asc())
        return list(self.db.scalars(statement).all())
