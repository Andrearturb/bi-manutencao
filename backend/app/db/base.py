"""Classe base para todos os modelos ORM SQLAlchemy."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Classe declarativa para herança de modelos SQLAlchemy."""

    pass