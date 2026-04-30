from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.repositories.chamado_repository import ChamadoRepository
from app.repositories.dashboard_cache_repository import DashboardCacheRepository
from app.schemas.importacao import ImportacaoResponse
from app.services.chamado_transformer import ChamadoTransformer
from app.services.dashboard_service import DashboardService
from app.services.excel_import_service import ExcelImportService


class ImportacaoManutencaoService:
    """Responsável pelo fluxo completo de importação da manutenção."""

    MODULO_POR_TIPO = {
        "corretiva": "manutencao_corretiva",
        "preventiva": "manutencao_preventiva",
    }

    def __init__(self, db: Session) -> None:
        self.db = db
        self.transformer = ChamadoTransformer()
        self.excel_import_service = ExcelImportService(self.transformer)
        self.dashboard_service = DashboardService()
        self.chamado_repository = ChamadoRepository(db)
        self.dashboard_cache_repository = DashboardCacheRepository(db)

    async def executar(self, arquivo: UploadFile, tipo: str) -> ImportacaoResponse:
        if tipo not in self.MODULO_POR_TIPO:
            raise ValueError("Tipo de manutenção inválido.")

        conteudo = await arquivo.read()
        registros = self.excel_import_service.ler_registros(
            conteudo,
            tipo_esperado=tipo,
        )

        upload_data = datetime.now(timezone.utc)
        nome_modulo = self.MODULO_POR_TIPO[tipo]

        self.chamado_repository.substituir_todos(
            registros=registros,
            tipo_manutencao=tipo,
            nome_arquivo=arquivo.filename,
            upload_data=upload_data,
        )

        json_dashboard = self.dashboard_service.montar_json_dashboard(
            registros=registros,
            nome_arquivo=arquivo.filename,
            upload_data=upload_data,
        )

        self.dashboard_cache_repository.salvar(
            nome_modulo=nome_modulo,
            json_dados=json_dashboard,
            upload_data=upload_data,
        )

        return ImportacaoResponse(
            mensagem="Importação realizada com sucesso.",
            total_registros=len(registros),
            nome_arquivo=arquivo.filename,
        )