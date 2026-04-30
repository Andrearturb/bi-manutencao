"""Modelo ORM para custos importados e tratados."""

from datetime import datetime

from sqlalchemy import DateTime, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CustoTratado(Base):
    """Representa um registro de custo processado."""

    __tablename__ = "custos_tratados"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    upload_data: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    nome_arquivo: Mapped[str | None] = mapped_column(Text, nullable=True)

    divisao: Mapped[str | None] = mapped_column(Text, nullable=True)
    sap: Mapped[str | None] = mapped_column(Text, nullable=True, index=True)

    numero_documento: Mapped[str | None] = mapped_column(Text, nullable=True)
    conta_razao: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_documento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    conta_lancto_contrap: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo_documento: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_entrada: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    conta_contra_partida: Mapped[str | None] = mapped_column(Text, nullable=True)
    atribuicao: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    nome_1: Mapped[str | None] = mapped_column(Text, nullable=True)

    loja: Mapped[str | None] = mapped_column(Text, nullable=True)
    praca: Mapped[str | None] = mapped_column(Text, nullable=True)

    competencia: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    categoria: Mapped[str | None] = mapped_column(Text, nullable=True)
    subcategoria: Mapped[str | None] = mapped_column(Text, nullable=True)
    fornecedor: Mapped[str | None] = mapped_column(Text, nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)

    valor: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
