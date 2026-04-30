from datetime import datetime

from sqlalchemy import Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LojaReferencia(Base):
    __tablename__ = "lojas_referencia"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sap: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    nome_loja: Mapped[str] = mapped_column(Text, nullable=False)
    praca: Mapped[str | None] = mapped_column(Text, nullable=True)
    cnpj_loja: Mapped[str | None] = mapped_column(Text, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    data_atualizacao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
