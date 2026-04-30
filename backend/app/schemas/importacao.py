"""Esquemas de validação de dados de importações."""

from pydantic import BaseModel


class ImportacaoResponse(BaseModel):
    """Resposta com resultado de uma importação de dados."""

    mensagem: str
    total_registros: int
    nome_arquivo: str