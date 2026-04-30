"""Modelo ORM para permissões de importação."""

from datetime import datetime

from sqlalchemy import DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ImportPermission(Base):
    """Representa uma permissão concedida a um usuário para importar dados."""

    __tablename__ = "import_permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    granted_by: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
