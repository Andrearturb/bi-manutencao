from sqlalchemy import DateTime, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ChamadoTratado(Base):
    __tablename__ = "chamados_tratados"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    upload_data: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    nome_arquivo: Mapped[str | None] = mapped_column(Text, nullable=True)

    ticket: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str | None] = mapped_column(Text, nullable=True)
    motivo_nao_aprovacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    coluna_d_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    sla_status: Mapped[str | None] = mapped_column(Text, nullable=True)

    loja: Mapped[str | None] = mapped_column(Text, nullable=True)
    praca: Mapped[str | None] = mapped_column(Text, nullable=True)

    categoria: Mapped[str | None] = mapped_column(Text, nullable=True)
    subcategoria: Mapped[str | None] = mapped_column(Text, nullable=True)

    analista_responsavel: Mapped[str | None] = mapped_column(Text, nullable=True)
    requisitante: Mapped[str | None] = mapped_column(Text, nullable=True)

    fornecedor: Mapped[str | None] = mapped_column(Text, nullable=True)

    descricao_servico: Mapped[str | None] = mapped_column(Text, nullable=True)
    solucao: Mapped[str | None] = mapped_column(Text, nullable=True)
    os_status: Mapped[str | None] = mapped_column(Text, nullable=True)
    os_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    data_requisicao: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    data_conclusao: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)

    valor_aprovado: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)