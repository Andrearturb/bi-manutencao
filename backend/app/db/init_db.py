from app.db.base import Base
from app.db.session import engine
from app.models.chamado_tratado import ChamadoTratado
from app.models.dashboard_cache import DashboardCache


def init_db() -> None:
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_importados RENAME TO chamados_tratados"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_tratados ADD COLUMN IF NOT EXISTS os_status TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_tratados ADD COLUMN IF NOT EXISTS os_url TEXT"
        )

    Base.metadata.create_all(bind=engine)