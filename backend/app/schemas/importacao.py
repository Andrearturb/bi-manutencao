from pydantic import BaseModel


class ImportacaoResponse(BaseModel):
    mensagem: str
    total_registros: int
    nome_arquivo: str