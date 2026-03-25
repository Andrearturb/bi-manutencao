import math
import re
import unicodedata
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any


class ChamadoTransformer:
    """Responsável por transformar os dados brutos da planilha."""

    STATUS_QUE_ENTRAM_NO_SLA = {
        "chamado concluido",
        "solicitacao finalizada",
    }

    def normalizar_texto(self, valor: Any) -> str | None:
        if valor is None:
            return None

        if isinstance(valor, float) and math.isnan(valor):
            return None

        texto = str(valor).strip()
        if not texto:
            return None

        return re.sub(r"\s+", " ", texto)

    def normalizar_comparacao(self, valor: Any) -> str:
        texto = self.normalizar_texto(valor) or ""
        texto = unicodedata.normalize("NFKD", texto)
        texto = "".join(
            caractere
            for caractere in texto
            if not unicodedata.combining(caractere)
        )
        return texto.lower().strip()

    def limpar_loja(self, valor: Any) -> str | None:
        texto = self.normalizar_texto(valor)
        if not texto:
            return None

        return texto.split("|")[0].strip()

    def limpar_fornecedor(self, valor: Any) -> str | None:
        texto = self.normalizar_texto(valor)
        if not texto:
            return None

        if " - " in texto:
            texto = texto.split(" - ", 1)[1].strip()

        return texto

    def parse_data(self, valor: Any) -> datetime | None:
        if valor is None:
            return None

        if isinstance(valor, datetime):
            return valor

        # Algumas planilhas trazem data como serial numerico do Excel.
        if isinstance(valor, (int, float)) and not isinstance(valor, bool):
            if isinstance(valor, float) and math.isnan(valor):
                return None

            serial = float(valor)
            if serial <= 0:
                return None

            try:
                return datetime(1899, 12, 30) + timedelta(days=serial)
            except (OverflowError, ValueError):
                return None

        texto = self.normalizar_texto(valor)
        if not texto:
            return None

        formatos = (
            "%Y-%m-%d %H:%M:%S",
            "%d/%m/%Y %H:%M:%S",
            "%d/%m/%Y",
            "%Y-%m-%d",
        )

        for formato in formatos:
            try:
                return datetime.strptime(texto, formato)
            except ValueError:
                continue

        # Quando a data vem como serial do Excel em texto (ex.: "45678" ou "45678,0").
        if re.fullmatch(r"\d+(?:[\.,]\d+)?", texto):
            try:
                serial = float(texto.replace(",", "."))
                if serial > 0:
                    return datetime(1899, 12, 30) + timedelta(days=serial)
            except ValueError:
                pass

        # Fallback para valores ISO com timezone ou fracoes de segundo.
        try:
            iso_texto = texto.replace("Z", "+00:00")
            return datetime.fromisoformat(iso_texto)
        except ValueError:
            pass

        return None

    def parse_decimal(self, valor: Any) -> Decimal | None:
        texto = self.normalizar_texto(valor)
        if not texto:
            return None

        texto = texto.replace(".", "").replace(",", ".")

        try:
            return Decimal(texto)
        except Exception:
            return None

    def status_entra_no_sla(self, status: Any) -> bool:
        status_normalizado = self.normalizar_comparacao(status)
        return status_normalizado in self.STATUS_QUE_ENTRAM_NO_SLA

    def calcular_sla_status(self, coluna_d_raw: Any, status: Any) -> str | None:
        if not self.status_entra_no_sla(status):
            return None

        coluna_d_normalizada = self.normalizar_comparacao(coluna_d_raw)

        if "atras" in coluna_d_normalizada:
            return "Atrasado"

        return "NoPrazo"

    def transformar_registro(self, row: dict[str, Any]) -> dict[str, Any]:
        coluna_d_raw = row.get("coluna_d_raw")
        status = row.get("status")

        return {
            "ticket": self.normalizar_texto(row.get("ticket")),
            "status": self.normalizar_texto(status),
            "motivo_nao_aprovacao": self.normalizar_texto(
                row.get("motivo_nao_aprovacao")
            ),
            "coluna_d_raw": self.normalizar_texto(coluna_d_raw),
            "sla_status": self.calcular_sla_status(coluna_d_raw, status),
            "loja": self.limpar_loja(row.get("loja")),
            "praca": self.normalizar_texto(row.get("praca")),
            "categoria": self.normalizar_texto(row.get("categoria")),
            "subcategoria": self.normalizar_texto(row.get("subcategoria")),
            "analista_responsavel": self.normalizar_texto(
                row.get("analista_responsavel")
            ),
            "requisitante": self.normalizar_texto(row.get("requisitante")),
            "fornecedor": self.limpar_fornecedor(row.get("fornecedor")),
            "descricao_servico": self.normalizar_texto(row.get("descricao_servico")),
            "solucao": self.normalizar_texto(row.get("solucao")),
            "data_requisicao": self.parse_data(row.get("data_requisicao")),
            "data_conclusao": self.parse_data(row.get("data_conclusao")),
            "valor_aprovado": self.parse_decimal(row.get("valor_aprovado")),
        }