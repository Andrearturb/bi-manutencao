from app.db.base import Base
from app.db.session import engine
from app.models.chamado_tratado import ChamadoTratado
from app.models.custo_tratado import CustoTratado
from app.models.dashboard_cache import DashboardCache
from app.models.import_permission import ImportPermission
from app.models.loja_referencia import LojaReferencia


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
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_tratados ADD COLUMN IF NOT EXISTS tipo_manutencao TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_tratados ADD COLUMN IF NOT EXISTS local_atendimento TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_tratados ADD COLUMN IF NOT EXISTS status_assinatura TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_tratados ADD COLUMN IF NOT EXISTS status_ordem_servico TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS chamados_tratados ADD COLUMN IF NOT EXISTS created_on TIMESTAMP"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS divisao TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS numero_documento TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS conta_razao TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS data_documento TIMESTAMP"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS conta_lancto_contrap TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS tipo_documento TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS data_entrada TIMESTAMP"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS conta_contra_partida TEXT"
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS atribuicao TIMESTAMP"
        )
        connection.exec_driver_sql(
            """
            ALTER TABLE IF EXISTS custos_tratados
            ALTER COLUMN atribuicao TYPE TIMESTAMP
            USING (
                CASE
                    WHEN atribuicao IS NULL THEN NULL
                    WHEN btrim(atribuicao::text) = '' THEN NULL
                    WHEN atribuicao::text ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN to_timestamp(atribuicao::text, 'DD/MM/YYYY')
                    WHEN atribuicao::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN atribuicao::text::timestamp
                    ELSE NULL
                END
            )
            """
        )
        connection.exec_driver_sql(
            "ALTER TABLE IF EXISTS custos_tratados ADD COLUMN IF NOT EXISTS nome_1 TEXT"
        )

    Base.metadata.create_all(bind=engine)