from pydantic import BaseModel, Field


class LojaReferenciaResponse(BaseModel):
    sap: str
    nome_loja: str
    praca: str | None = None
    cnpj_loja: str | None = None
    ativo: bool


class LojaMapeamentoRequest(BaseModel):
    saps: list[str] = Field(default_factory=list)


class LojaMapeamentoItem(BaseModel):
    sap: str
    encontrado: bool
    nome_loja: str | None = None
    praca: str | None = None
    cnpj_loja: str | None = None


class LojaMapeamentoResponse(BaseModel):
    itens: list[LojaMapeamentoItem]
