from io import BytesIO
import re
import unicodedata
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

import pandas as pd

from app.repositories.loja_referencia_repository import LojaReferenciaRepository


class CustosImportService:
    ALIASES = {
        "sap": ["sap", "divisao", "divisão", "id sap", "codigo sap", "referencia sap", "id_sap"],
        "divisao": ["divisao", "divisão"],
        "numero_documento": ["nº documento", "no documento", "numero documento"],
        "conta_razao": ["conta do razao", "conta do razão", "conta razao"],
        "data_documento": ["data do documento", "data documento", "data"],
        "conta_lancto_contrap": ["conta lncto.contrap.", "conta lnçto.contrap.", "conta lancto contrap"],
        "tipo_documento": ["tipo de documento", "tipo documento"],
        "data_entrada": ["data de entrada", "data entrada"],
        "conta_contra_partida": ["conta contra partida", "conta contrapartida"],
        "atribuicao": ["atribuicao", "atribuição"],
        "texto": ["texto", "descricao", "descrição", "historico", "histórico", "detalhe", "servico", "serviço"],
        "nome_1": ["nome 1", "fornecedor", "prestador", "nome fornecedor"],
        "valor": [
            "montante em moeda interna",
            "valor",
            "valor total",
            "custo",
            "valor custo",
            "valor_aprovado",
        ],
        "competencia": [
            "data do documento",
            "data de lancamento",
            "data de lançamento",
            "data de pagamento",
            "competencia",
            "mes",
            "data",
            "data competencia",
        ],
        "categoria": ["categoria", "grupo", "tipo"],
        "subcategoria": ["subcategoria", "sub grupo", "subgrupo"],
        "fornecedor": ["nome 1", "fornecedor", "prestador", "nome fornecedor"],
        "descricao": ["texto", "descricao", "descrição", "historico", "histórico", "detalhe", "servico", "serviço"],
    }

    def __init__(self, loja_repository: LojaReferenciaRepository) -> None:
        self.loja_repository = loja_repository

    def ler_registros(self, file_bytes: bytes) -> list[dict[str, Any]]:
        dataframe = pd.read_excel(BytesIO(file_bytes), dtype=object)
        indice = self._montar_indice_colunas(dataframe)

        # Regra de negocio: em custos, a coluna "Divisão" representa o SAP da loja.
        coluna_sap = self._resolver_coluna(indice, "divisao") or self._resolver_coluna(indice, "sap")
        coluna_valor = self._resolver_coluna(indice, "valor")

        if coluna_sap is None:
            raise ValueError("Planilha financeira sem coluna SAP.")
        if coluna_valor is None:
            raise ValueError("Planilha financeira sem coluna de valor.")

        colunas = {
            "sap": coluna_sap,
            "divisao": self._resolver_coluna(indice, "divisao") or coluna_sap,
            "numero_documento": self._resolver_coluna(indice, "numero_documento"),
            "conta_razao": self._resolver_coluna(indice, "conta_razao"),
            "data_documento": self._resolver_coluna(indice, "data_documento"),
            "conta_lancto_contrap": self._resolver_coluna(indice, "conta_lancto_contrap"),
            "tipo_documento": self._resolver_coluna(indice, "tipo_documento"),
            "data_entrada": self._resolver_coluna(indice, "data_entrada"),
            "conta_contra_partida": self._resolver_coluna(indice, "conta_contra_partida"),
            "atribuicao": self._resolver_coluna(indice, "atribuicao"),
            "texto": self._resolver_coluna(indice, "texto"),
            "nome_1": self._resolver_coluna(indice, "nome_1"),
            "valor": coluna_valor,
            "competencia": self._resolver_coluna(indice, "competencia"),
            "categoria": self._resolver_coluna(indice, "categoria"),
            "subcategoria": self._resolver_coluna(indice, "subcategoria"),
            "fornecedor": self._resolver_coluna(indice, "fornecedor"),
            "descricao": self._resolver_coluna(indice, "descricao"),
        }

        saps = [
            self._normalizar_sap(row.get(colunas["sap"]))
            for _, row in dataframe.iterrows()
            if self._normalizar_sap(row.get(colunas["sap"]))
        ]
        lojas_por_sap = self.loja_repository.obter_por_saps(list(set(saps)))

        registros: list[dict[str, Any]] = []
        for _, row in dataframe.iterrows():
            sap = self._normalizar_sap(row.get(colunas["sap"]))
            valor = self._parse_decimal(row.get(colunas["valor"]))
            if not sap or valor is None:
                continue

            loja_ref = lojas_por_sap.get(sap)
            registros.append(
                {
                    "sap": sap,
                    "divisao": self._normalizar_texto(row.get(colunas["divisao"])),
                    "numero_documento": self._normalizar_texto(row.get(colunas["numero_documento"])),
                    "conta_razao": self._normalizar_texto(row.get(colunas["conta_razao"])),
                    "data_documento": self._parse_data(row.get(colunas["data_documento"])),
                    "conta_lancto_contrap": self._normalizar_texto(row.get(colunas["conta_lancto_contrap"])),
                    "tipo_documento": self._normalizar_texto(row.get(colunas["tipo_documento"])),
                    "data_entrada": self._parse_data(row.get(colunas["data_entrada"])),
                    "conta_contra_partida": self._normalizar_texto(row.get(colunas["conta_contra_partida"])),
                    "atribuicao": self._parse_data(row.get(colunas["atribuicao"])),
                    "loja": loja_ref.nome_loja if loja_ref else None,
                    "praca": loja_ref.praca if loja_ref else None,
                    "competencia": self._parse_data(row.get(colunas["competencia"])),
                    "categoria": self._normalizar_texto(row.get(colunas["categoria"])),
                    "subcategoria": self._normalizar_texto(row.get(colunas["subcategoria"])),
                    "fornecedor": self._normalizar_texto(row.get(colunas["fornecedor"])),
                    "descricao": self._extrair_numeros(row.get(colunas["texto"]))
                    or self._extrair_numeros(row.get(colunas["descricao"])),
                    "nome_1": self._normalizar_texto(row.get(colunas["nome_1"])),
                    "valor": valor,
                }
            )

        if not registros:
            raise ValueError("Nenhum registro valido de custos foi encontrado na planilha.")

        return registros

    def _montar_indice_colunas(self, dataframe: pd.DataFrame) -> dict[str, str]:
        indice: dict[str, str] = {}
        for coluna in dataframe.columns:
            nome = "" if coluna is None else str(coluna)
            chave = self._normalizar_chave(nome)
            if chave and chave not in indice:
                indice[chave] = coluna
        return indice

    def _resolver_coluna(self, indice: dict[str, str], campo: str) -> str | None:
        for alias in self.ALIASES.get(campo, []):
            chave = self._normalizar_chave(alias)
            if chave in indice:
                return indice[chave]
        return None

    def _normalizar_chave(self, valor: str) -> str:
        texto = unicodedata.normalize("NFKD", valor)
        texto = "".join(char for char in texto if not unicodedata.combining(char))
        texto = texto.strip().lower()
        return " ".join(texto.split())

    def _normalizar_texto(self, valor: Any) -> str | None:
        if valor is None:
            return None
        texto = str(valor).strip()
        if not texto or texto.lower() == "nan":
            return None
        return re.sub(r"\s+", " ", texto)

    def _extrair_numeros(self, valor: Any) -> str | None:
        texto = self._normalizar_texto(valor)
        if not texto:
            return None

        # Regra de NF: quando existir sufixo apos '-', considerar apenas a parte anterior.
        primeiro_bloco = texto.split()[0]
        base_nf = primeiro_bloco.split("-")[0]
        numeros = re.sub(r"\D+", "", base_nf)

        if not numeros:
            numeros = re.sub(r"\D+", "", texto)
        return numeros or None

    def _normalizar_sap(self, valor: Any) -> str | None:
        texto = self._normalizar_texto(valor)
        if not texto:
            return None
        if texto.endswith(".0") and texto.replace(".", "", 1).isdigit():
            return texto[:-2]
        return texto

    def _parse_decimal(self, valor: Any) -> Decimal | None:
        texto = self._normalizar_texto(valor)
        if not texto:
            return None

        texto = texto.replace("R$", "").replace(" ", "")

        if "," in texto:
            # Formato brasileiro: 1.234,56
            texto = texto.replace(".", "").replace(",", ".")

        try:
            return Decimal(texto)
        except Exception:
            return None

    def _parse_data(self, valor: Any) -> datetime | None:
        if valor is None:
            return None
        if isinstance(valor, datetime):
            return valor

        if isinstance(valor, (int, float)) and not isinstance(valor, bool):
            try:
                serial = float(valor)
                if serial > 0:
                    return datetime(1899, 12, 30) + timedelta(days=serial)
            except Exception:
                return None

        texto = self._normalizar_texto(valor)
        if not texto:
            return None

        formatos = ("%d/%m/%Y", "%Y-%m-%d", "%m/%Y", "%Y-%m")
        for formato in formatos:
            try:
                data = datetime.strptime(texto, formato)
                if formato in ("%m/%Y", "%Y-%m"):
                    return data.replace(day=1)
                return data
            except ValueError:
                continue

        return None
