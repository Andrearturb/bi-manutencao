"""Repositório para gerenciamento de permissões de importação."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.import_permission import ImportPermission


class ImportPermissionRepository:
    """Gerencia permissões de importação para usuários."""

    def __init__(self, db: Session) -> None:
        """Inicializa repositório com sessão de banco de dados."""
        self.db = db

    def exists_for_email(self, email: str) -> bool:
        """Verifica se um e-mail tem permissão de importação."""
        statement = select(ImportPermission.id).where(ImportPermission.email == email)
        return self.db.execute(statement).scalar_one_or_none() is not None

    def create(self, email: str, granted_by: str) -> ImportPermission:
        """Cria nova permissão de importação para um e-mail."""
        permission = ImportPermission(email=email, granted_by=granted_by)
        self.db.add(permission)
        self.db.commit()
        self.db.refresh(permission)
        return permission

    def list_all(self) -> list[ImportPermission]:
        """Lista todas as permissões de importação ordenadas por e-mail."""
        statement = select(ImportPermission).order_by(ImportPermission.email.asc())
        return list(self.db.scalars(statement).all())

    def delete_by_email(self, email: str) -> bool:
        """Remove permissão de importação para um e-mail específico."""
        statement = select(ImportPermission).where(ImportPermission.email == email)
        permission = self.db.scalar(statement)
        if permission is None:
            return False

        self.db.delete(permission)
        self.db.commit()
        return True
