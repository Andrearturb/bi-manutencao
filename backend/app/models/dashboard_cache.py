from sqlalchemy import DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DashboardCache(Base):
    __tablename__ = "dashboard_cache"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome_modulo: Mapped[str] = mapped_column(Text, nullable=False)
    json_dados: Mapped[dict] = mapped_column(JSONB, nullable=False)
    data_atualizacao: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    upload_data: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)