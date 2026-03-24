from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.repositories.chamado_repository import ChamadoRepository
from app.repositories.dashboard_cache_repository import DashboardCacheRepository
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/manutencao", response_model=DashboardResponse)
def get_dashboard_manutencao() -> DashboardResponse:
    db: Session = SessionLocal()

    try:
        cache_repository = DashboardCacheRepository(db)
        cache = cache_repository.obter_por_modulo("manutencao")

        if cache is not None:
            return DashboardResponse(**cache)

        chamado_repository = ChamadoRepository(db)
        dashboard_service = DashboardService()

        chamados = chamado_repository.listar_todos()
        if not chamados:
            raise HTTPException(
                status_code=404,
                detail="Nenhum dado encontrado para o dashboard.",
            )

        registros = []
        for chamado in chamados:
            registros.append(
                {
                    "ticket": chamado.ticket,
                    "status": chamado.status,
                    "motivo_nao_aprovacao": chamado.motivo_nao_aprovacao,
                    "coluna_d_raw": chamado.coluna_d_raw,
                    "sla_status": chamado.sla_status,
                    "loja": chamado.loja,
                    "praca": chamado.praca,
                    "categoria": chamado.categoria,
                    "subcategoria": chamado.subcategoria,
                    "analista_responsavel": chamado.analista_responsavel,
                    "requisitante": chamado.requisitante,
                    "fornecedor": chamado.fornecedor,
                    "descricao_servico": chamado.descricao_servico,
                    "solucao": chamado.solucao,
                    "data_requisicao": chamado.data_requisicao,
                    "data_conclusao": chamado.data_conclusao,
                    "valor_aprovado": chamado.valor_aprovado,
                }
            )

        ultimo_upload_data = chamados[0].upload_data
        ultimo_nome_arquivo = chamados[0].nome_arquivo or "base_recuperada"

        json_dashboard = dashboard_service.montar_json_dashboard(
            registros=registros,
            nome_arquivo=ultimo_nome_arquivo,
            upload_data=ultimo_upload_data,
        )

        cache_repository.salvar(
            nome_modulo="manutencao",
            json_dados=json_dashboard,
            upload_data=ultimo_upload_data,
        )

        return DashboardResponse(**json_dashboard)

    finally:
        db.close()