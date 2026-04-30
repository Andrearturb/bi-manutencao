"""Serviço para ler e processar arquivos Excel em registros normalizados."""

import unicodedata
from io import BytesIO
from typing import Any

import pandas as pd

from app.services.chamado_transformer import ChamadoTransformer


class ExcelImportService:
    """Lê arquivos Excel e transforma em registros validados de chamados."""

    FRAGMENTO_ORIGEM_POR_TIPO = {
        "corretiva": "corretiva",
        "preventiva": "preventiva",
    }

    ALIASES_POR_CAMPO = {
        "ticket": ["ticket", "a", "b"],
        "coluna_d_raw": ["d", "e", "progresso sla", "h"],
        "status": ["status", "e", "m"],
        "motivo_nao_aprovacao": [
            "motivo da nao aprovacao",
            "motivo de reprovacao - text",
            "f",
            "an",
        ],
        "requisitante": ["requisitante", "m"],
        "local_atendimento": ["local de atendimento", "n", "p"],
        "loja": ["loja_custom", "local de atendimento", "local de atendimento loja", "o", "p", "ba"],
        "praca": ["praca", "p", "q"],
        "categoria": ["servico (categoria)", "categoria", "q", "s"],
        "subcategoria": ["subcategoria", "s", "t"],
        "descricao_servico": ["descricao do servico - text", "u", "x"],
        "analista_responsavel": ["analista responsavel", "y", "aa"],
        "fornecedor": ["fornecedor", "aa", "ac"],
        "valor_aprovado": ["valor aprovado", "valor total", "ar", "aj"],
        "solucao": ["solucao - text", "solucao aplicada - text", "au", "ak"],
        "status_assinatura": ["status de assinatura", "ay"],
        "status_ordem_servico": ["status da ordem de servico", "az", "bt"],
        "pdf_view": ["pdf_view", "bb", "bw"],
        "os_raw": ["bs"],
        "data_conclusao": ["data da conclusao", "data de encerramento - start", "bg", "bc"],
        "data_requisicao": ["created on", "data da requisicao", "be", "ce", "by"],
        "created_on": ["created on", "be", "by"],
        "origem": ["origem", "g", "l"],
    }

    def __init__(self, transformer: ChamadoTransformer) -> None:
        """Inicializa o serviço com um transformador de dados."""
        self.transformer = transformer

    def ler_registros(
        self,
        file_bytes: bytes,
        tipo_esperado: str | None = None,
    ) -> list[dict[str, Any]]:
        """Lê arquivo Excel e retorna lista de registros normalizados."""
        dataframe = pd.read_excel(BytesIO(file_bytes), dtype=object)
        colunas_por_alias = self._montar_indice_colunas(dataframe)

        if tipo_esperado is not None:
            self._validar_origem(dataframe, colunas_por_alias, tipo_esperado)

        dados_normalizados: dict[str, Any] = {}
        for campo in self.ALIASES_POR_CAMPO:
            if campo == "coluna_d_raw":
                coluna_origem = self._resolver_coluna_sla(
                    dataframe,
                    colunas_por_alias,
                    tipo_esperado,
                )
            else:
                coluna_origem = self._resolver_coluna_origem(campo, colunas_por_alias)

            if coluna_origem is None:
                dados_normalizados[campo] = None
                continue

            dados_normalizados[campo] = dataframe[coluna_origem]

        dataframe_normalizado = pd.DataFrame(dados_normalizados)

        registros: list[dict[str, Any]] = []
        for _, row in dataframe_normalizado.iterrows():
            registro_bruto = row.to_dict()
            registro_tratado = self.transformer.transformar_registro(registro_bruto)
            registros.append(registro_tratado)

        return registros

    def _validar_origem(
        self,
        dataframe: pd.DataFrame,
        colunas_por_alias: dict[str, str],
        tipo_esperado: str,
    ) -> None:
        """Valida que o tipo de manutenção confere com a coluna de origem na planilha."""
        fragmento_esperado = self.FRAGMENTO_ORIGEM_POR_TIPO.get(tipo_esperado)
        if fragmento_esperado is None:
            raise ValueError("Tipo de manutenção inválido.")

        coluna_origem = self._resolver_coluna_origem("origem", colunas_por_alias)
        if coluna_origem is None:
            raise ValueError(
                "A planilha não contém a coluna de origem para validar o tipo de manutenção."
            )

        valores = dataframe[coluna_origem].dropna().map(self._normalizar_chave_coluna)
        valores = [valor for valor in valores if valor]
        if not valores:
            raise ValueError("A coluna de origem está vazia e não permite validar o tipo.")

        if any(fragmento_esperado in valor for valor in valores):
            return

        exemplos = ", ".join(sorted(set(valores))[:3])
        raise ValueError(
            "Tipo informado não confere com a origem da planilha. "
            f"Tipo esperado: {tipo_esperado}. Origens encontradas: {exemplos}."
        )

    def _montar_indice_colunas(self, dataframe: pd.DataFrame) -> dict[str, str]:
        """Cria índice de colunas por alias de campo e letra Excel."""
        indice: dict[str, str] = {}
        for posicao, coluna in enumerate(dataframe.columns):
            nome = "" if coluna is None else str(coluna)
            nome_normalizado = self._normalizar_chave_coluna(nome)
            if nome_normalizado and nome_normalizado not in indice:
                indice[nome_normalizado] = coluna

            letra = self._obter_nome_coluna_excel(posicao)
            letra_normalizada = self._normalizar_chave_coluna(letra)
            if letra_normalizada not in indice:
                indice[letra_normalizada] = coluna

        return indice

    def _resolver_coluna_origem(
        self,
        campo: str,
        colunas_por_alias: dict[str, str],
    ) -> str | None:
        """Encontra a coluna original que correspondé a um campo."""
        aliases = self.ALIASES_POR_CAMPO.get(campo, [])
        for alias in aliases:
            chave = self._normalizar_chave_coluna(alias)
            if chave in colunas_por_alias:
                return colunas_por_alias[chave]

        return None

    def _resolver_coluna_sla(
        self,
        dataframe: pd.DataFrame,
        colunas_por_alias: dict[str, str],
        tipo_esperado: str | None,
    ) -> str | None:
        """Resolve coluna de SLA com prioridade conforme tipo de manutenção."""
        prioridade_por_tipo: dict[str, list[str]] = {
            "corretiva": ["d", "e", "progresso sla", "h"],
            "preventiva": ["e", "progresso sla", "h", "d"],
        }
        aliases = prioridade_por_tipo.get(tipo_esperado or "", self.ALIASES_POR_CAMPO["coluna_d_raw"])

        fallback_coluna: str | None = None
        for alias in aliases:
            chave = self._normalizar_chave_coluna(alias)
            if chave not in colunas_por_alias:
                continue

            coluna = colunas_por_alias[chave]
            if fallback_coluna is None:
                fallback_coluna = coluna

            serie = dataframe[coluna]
            possui_valores = serie.notna().any() and serie.astype(str).str.strip().ne("").any()
            if possui_valores:
                return coluna

        return fallback_coluna

    def _normalizar_chave_coluna(self, valor: str) -> str:
        """Normaliza um nome de coluna para chave de busca."""
        texto = unicodedata.normalize("NFKD", valor)
        texto = "".join(char for char in texto if not unicodedata.combining(char))
        texto = texto.strip().lower()
        return " ".join(texto.split())

    def _obter_nome_coluna_excel(self, index: int) -> str:
        """Converte índice numérico para letra de coluna Excel (A, B, ..., AA, AB)."""
        resultado = ""
        index += 1

        while index > 0:
            index, resto = divmod(index - 1, 26)
            resultado = chr(65 + resto) + resultado

        return resultado