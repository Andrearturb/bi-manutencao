from datetime import datetime
from typing import Any


class DashboardService:
    """Responsável por montar o JSON final do dashboard."""

    def montar_json_dashboard(
        self,
        registros: list[dict[str, Any]],
        nome_arquivo: str,
        upload_data: datetime,
    ) -> dict[str, Any]:
        dados = [self._montar_item_dashboard(registro) for registro in registros]

        atrasado = sum(
            1 for registro in registros if registro.get("sla_status") == "Atrasado"
        )
        no_prazo = sum(
            1 for registro in registros if registro.get("sla_status") == "NoPrazo"
        )
        total = atrasado + no_prazo

        return {
            "dados": dados,
            "sla": {
                "noPrazo": no_prazo,
                "atrasado": atrasado,
                "total": total,
            },
            "upload": {
                "uploadData": upload_data.isoformat(),
                "nomeArquivo": nome_arquivo,
                "totalRegistros": len(dados),
            },
        }

    def _montar_item_dashboard(self, registro: dict[str, Any]) -> dict[str, Any]:
        return {
            "ticket": registro.get("ticket"),
            "status": registro.get("status"),
            "motivoNaoAprovacao": registro.get("motivo_nao_aprovacao"),
            "colunaDRaw": registro.get("coluna_d_raw"),
            "slaStatus": registro.get("sla_status"),
            "loja": registro.get("loja"),
            "praca": registro.get("praca"),
            "categoria": registro.get("categoria"),
            "subcategoria": registro.get("subcategoria"),
            "analistaResponsavel": registro.get("analista_responsavel"),
            "requisitante": registro.get("requisitante"),
            "fornecedor": registro.get("fornecedor"),
            "descricaoServico": registro.get("descricao_servico"),
            "solucao": registro.get("solucao"),
            "dataRequisicao": (
                registro["data_requisicao"].isoformat()
                if registro.get("data_requisicao")
                else None
            ),
            "dataConclusao": (
                registro["data_conclusao"].isoformat()
                if registro.get("data_conclusao")
                else None
            ),
            "valorAprovado": (
                float(registro["valor_aprovado"])
                if registro.get("valor_aprovado") is not None
                else None
            ),
        }