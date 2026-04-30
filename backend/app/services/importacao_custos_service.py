from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.repositories.custo_repository import CustoRepository
from app.repositories.dashboard_cache_repository import DashboardCacheRepository
from app.repositories.loja_referencia_repository import LojaReferenciaRepository
from app.schemas.importacao import ImportacaoResponse
from app.services.custos_import_service import CustosImportService


class ImportacaoCustosService:
    NOME_MODULO = "custos"

    def __init__(self, db: Session) -> None:
        self.db = db
        self.loja_repository = LojaReferenciaRepository(db)
        self.import_service = CustosImportService(self.loja_repository)
        self.custo_repository = CustoRepository(db)
        self.dashboard_cache_repository = DashboardCacheRepository(db)

    async def executar(self, arquivo: UploadFile) -> ImportacaoResponse:
        conteudo = await arquivo.read()
        registros = self.import_service.ler_registros(conteudo)

        upload_data = datetime.now(timezone.utc)

        self.custo_repository.substituir_todos(
            registros=registros,
            nome_arquivo=arquivo.filename,
            upload_data=upload_data,
        )

        dados = [self._montar_item_dashboard(registro) for registro in registros]
        self.dashboard_cache_repository.salvar(
            nome_modulo=self.NOME_MODULO,
            json_dados={
                "dadosCustos": dados,
                "uploadCustos": {
                    "uploadData": upload_data.isoformat(),
                    "nomeArquivo": arquivo.filename,
                    "totalRegistros": len(dados),
                },
            },
            upload_data=upload_data,
        )

        return ImportacaoResponse(
            mensagem="Importacao de custos realizada com sucesso.",
            total_registros=len(registros),
            nome_arquivo=arquivo.filename,
        )

    def _montar_item_dashboard(self, registro: dict) -> dict:
        return {
            "divisao": registro.get("divisao"),
            "numero_documento": registro.get("numero_documento"),
            "conta_razao": registro.get("conta_razao"),
            "data_documento": registro["data_documento"].isoformat() if registro.get("data_documento") else None,
            "conta_lancto_contrap": registro.get("conta_lancto_contrap"),
            "tipo_documento": registro.get("tipo_documento"),
            "data_entrada": registro["data_entrada"].isoformat() if registro.get("data_entrada") else None,
            "conta_contra_partida": registro.get("conta_contra_partida"),
            "atribuicao": registro["atribuicao"].isoformat() if registro.get("atribuicao") else None,
            "nome_1": registro.get("nome_1"),
            "loja": registro.get("loja"),
            "praca": registro.get("praca"),
            "competencia": registro["competencia"].isoformat() if registro.get("competencia") else None,
            "fornecedor": registro.get("fornecedor"),
            "descricao": registro.get("descricao"),
            "valor": float(registro["valor"]) if registro.get("valor") is not None else None,
        }
