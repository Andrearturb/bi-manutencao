from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ChamadoBase(BaseModel):
    ticket: Optional[str] = None

    status: Optional[str] = None
    motivoNaoAprovacao: Optional[str] = None

    colunaDRaw: Optional[str] = None
    slaStatus: Optional[str] = None

    loja: Optional[str] = None
    praca: Optional[str] = None

    categoria: Optional[str] = None
    subcategoria: Optional[str] = None

    analistaResponsavel: Optional[str] = None
    requisitante: Optional[str] = None

    fornecedor: Optional[str] = None

    descricaoServico: Optional[str] = None
    solucao: Optional[str] = None

    os: Optional[dict[str, Optional[str]]] = None

    dataRequisicao: Optional[datetime] = None
    dataConclusao: Optional[datetime] = None

    valorAprovado: Optional[float] = None


class ChamadoResponse(ChamadoBase):
    pass