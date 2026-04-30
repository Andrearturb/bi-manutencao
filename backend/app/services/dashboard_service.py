"""Serviço responsável por formatar payloads de resposta do dashboard."""

from datetime import datetime
from typing import Any


class DashboardService:
    """Constrói payloads da API do dashboard a partir de registros do repositório."""

    @staticmethod
    def _to_iso(value: Any) -> str | None:
        """Converte valores datetime para string ISO-8601 quando presentes."""
        if isinstance(value, datetime):
            return value.isoformat()
        return None

    @staticmethod
    def _to_float(value: Any) -> float | None:
        """Converte valores numéricos para float quando presentes."""
        if value is None:
            return None
        return float(value)

    def montar_json_dashboard(
        self,
        registros: list[dict[str, Any]],
        nome_arquivo: str,
        upload_data: datetime,
    ) -> dict[str, Any]:
        """Constrói resposta completa do dashboard com metadados."""
        dados = [self._montar_item_dashboard(registro) for registro in registros]

        return {
            "dados": dados,
            "upload": {
                "uploadData": upload_data.isoformat(),
                "nomeArquivo": nome_arquivo,
                "totalRegistros": len(dados),
            },
        }

    def _montar_item_dashboard(self, registro: dict[str, Any]) -> dict[str, Any]:
        """Mapeia um registro bruto para o schema público do dashboard."""
        return {
            "ticket": registro.get("ticket"),
            "status": registro.get("status"),
            "motivoNaoAprovacao": registro.get("motivo_nao_aprovacao"),
            "colunaDRaw": registro.get("coluna_d_raw"),
            "slaStatus": registro.get("sla_status"),
            "loja": registro.get("loja"),
            "localAtendimento": registro.get("local_atendimento"),
            "praca": registro.get("praca"),
            "categoria": registro.get("categoria"),
            "subcategoria": registro.get("subcategoria"),
            "analistaResponsavel": registro.get("analista_responsavel"),
            "requisitante": registro.get("requisitante"),
            "fornecedor": registro.get("fornecedor"),
            "descricaoServico": registro.get("descricao_servico"),
            "solucao": registro.get("solucao"),
            "statusAssinatura": registro.get("status_assinatura"),
            "statusOrdemServico": registro.get("status_ordem_servico"),
            "os": (
                {
                    "status": registro.get("os_status"),
                    "url": registro.get("os_url"),
                }
                if registro.get("os_status")
                else None
            ),
            "dataRequisicao": self._to_iso(registro.get("data_requisicao")),
            "dataConclusao": self._to_iso(registro.get("data_conclusao")),
            "createdOn": self._to_iso(registro.get("created_on")),
            "valorAprovado": self._to_float(registro.get("valor_aprovado")),
        }
