from io import BytesIO
from typing import Any

import pandas as pd

from app.services.chamado_transformer import ChamadoTransformer


class ExcelImportService:
    """Responsável por ler o Excel e converter em registros tratados."""

    COLUNAS_UTILIZADAS = {
        "A": "ticket",
        "D": "coluna_d_raw",
        "E": "status",
        "F": "motivo_nao_aprovacao",
        "M": "requisitante",
        "P": "loja",
        "Q": "praca",
        "S": "categoria",
        "T": "subcategoria",
        "X": "descricao_servico",
        "AA": "analista_responsavel",
        "AC": "fornecedor",
        "AR": "valor_aprovado",
        "AU": "solucao",
        "BS": "os_raw",
        "BG": "data_conclusao",
        "BY": "data_requisicao",
    }

    def __init__(self, transformer: ChamadoTransformer) -> None:
        self.transformer = transformer

    def ler_registros(self, file_bytes: bytes) -> list[dict[str, Any]]:
        dataframe = pd.read_excel(BytesIO(file_bytes), dtype=object)
        dataframe.columns = [
            self._obter_nome_coluna_excel(indice)
            for indice in range(len(dataframe.columns))
        ]

        colunas_disponiveis = [
            coluna
            for coluna in self.COLUNAS_UTILIZADAS
            if coluna in dataframe.columns
        ]

        dataframe = dataframe[colunas_disponiveis].rename(
            columns=self.COLUNAS_UTILIZADAS
        )

        registros: list[dict[str, Any]] = []
        for _, row in dataframe.iterrows():
            registro_bruto = row.to_dict()
            registro_tratado = self.transformer.transformar_registro(registro_bruto)
            registros.append(registro_tratado)

        return registros

    def _obter_nome_coluna_excel(self, index: int) -> str:
        resultado = ""
        index += 1

        while index > 0:
            index, resto = divmod(index - 1, 26)
            resultado = chr(65 + resto) + resultado

        return resultado