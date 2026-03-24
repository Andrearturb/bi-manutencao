from app.db.base import Base
from app.db.session import engine
from app.models.chamado_importado import ChamadoImportado
from app.models.dashboard_cache import DashboardCache


def init_db() -> None:
    Base.metadata.create_all(bind=engine)