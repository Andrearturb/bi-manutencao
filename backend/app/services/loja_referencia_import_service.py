from io import BytesIO
import unicodedata

import pandas as pd


class LojaReferenciaImportService:
    ALIASES = {
        "sap": ["sap", "id sap", "codigo sap", "referencia sap", "id_sap"],
        "nome_loja": [
            "loja",
            "nome loja",
            "nome da loja",
            "local de atendimento",
            "unidade",
        ],
        "praca": ["praca", "praca da loja", "regional"],
        "cnpj_loja": ["cnpj", "cnpj loja", "cnpj_loja"],
    }

    def ler_registros(self, file_bytes: bytes) -> list[dict]:
        dataframe = pd.read_excel(BytesIO(file_bytes), dtype=object)
        indice = self._montar_indice_colunas(dataframe)

        coluna_sap = self._resolver_coluna(indice, "sap")
        coluna_nome = self._resolver_coluna(indice, "nome_loja")
        coluna_praca = self._resolver_coluna(indice, "praca")
        coluna_cnpj = self._resolver_coluna(indice, "cnpj_loja")

        if coluna_sap is None:
            raise ValueError("Planilha de lojas sem coluna SAP.")
        if coluna_nome is None:
            raise ValueError("Planilha de lojas sem coluna de nome da loja.")

        registros_por_sap: dict[str, dict] = {}
        for _, row in dataframe.iterrows():
            sap = self._normalizar_texto(row.get(coluna_sap))
            nome_loja = self._normalizar_texto(row.get(coluna_nome))
            if not sap or not nome_loja:
                continue

            sap = sap.strip()
            registros_por_sap[sap] = {
                "sap": sap,
                "nome_loja": nome_loja,
                "praca": self._normalizar_texto(row.get(coluna_praca)) if coluna_praca else None,
                "cnpj_loja": self._normalizar_texto(row.get(coluna_cnpj)) if coluna_cnpj else None,
                "ativo": True,
            }

        registros = list(registros_por_sap.values())
        if not registros:
            raise ValueError("Nenhum registro valido de loja foi encontrado na planilha.")

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

    def _normalizar_texto(self, valor: object) -> str | None:
        if valor is None:
            return None
        texto = str(valor).strip()
        if not texto or texto.lower() == "nan":
            return None
        return " ".join(texto.split())
