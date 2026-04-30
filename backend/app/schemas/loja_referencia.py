"""Esquemas de validação de dados de lojas de referência."""

from pydantic import BaseModel, Field


class LojaReferenciaResponse(BaseModel):
    """Resposta com dados de uma loja de referência."""

    sap: str
    nome_loja: str
    praca: str | None = None
    cnpj_loja: str | None = None
    ativo: bool


class LojaMapeamentoRequest(BaseModel):
    """Request para mapear múltiplos SAPs para lojas."""

    saps: list[str] = Field(default_factory=list)


class LojaMapeamentoItem(BaseModel):
    """Item com resultado do mapeamento de um SAP para loja."""

    sap: str
    encontrado: bool
    nome_loja: str | None = None
    praca: str | None = None
    cnpj_loja: str | None = None


class LojaMapeamentoResponse(BaseModel):
    """Resposta com resultado do mapeamento de múltiplos SAPs."""

    itens: list[LojaMapeamentoItem]
