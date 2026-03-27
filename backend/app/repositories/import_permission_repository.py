from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.import_permission import ImportPermission


class ImportPermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def exists_for_email(self, email: str) -> bool:
        statement = select(ImportPermission.id).where(ImportPermission.email == email)
        return self.db.execute(statement).scalar_one_or_none() is not None

    def create(self, email: str, granted_by: str) -> ImportPermission:
        permission = ImportPermission(email=email, granted_by=granted_by)
        self.db.add(permission)
        self.db.commit()
        self.db.refresh(permission)
        return permission

    def list_all(self) -> list[ImportPermission]:
        statement = select(ImportPermission).order_by(ImportPermission.email.asc())
        return list(self.db.scalars(statement).all())

    def delete_by_email(self, email: str) -> bool:
        statement = select(ImportPermission).where(ImportPermission.email == email)
        permission = self.db.scalar(statement)
        if permission is None:
            return False

        self.db.delete(permission)
        self.db.commit()
        return True
