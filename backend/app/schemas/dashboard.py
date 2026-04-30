"""Esquemas de validação de dados de respostas do dashboard."""

from typing import Any, Dict, List

from pydantic import BaseModel

from app.schemas.chamado import ChamadoResponse


class DashboardResponse(BaseModel):
    """Resposta com dados do dashboard consolidados."""

    dados: List[ChamadoResponse]
    sla: Dict[str, Any]
    upload: Dict[str, Any]


class DashboardManutencaoResponse(BaseModel):
    """Resposta com dados separados de manutenção corretiva e preventiva."""

    dadosCorretivas: List[ChamadoResponse]
    dadosPreventivas: List[ChamadoResponse]
    uploadCorretivas: Dict[str, Any]
    uploadPreventivas: Dict[str, Any]


class DashboardCustosResponse(BaseModel):
    """Resposta com dados de custos no dashboard."""

    dadosCustos: List[Dict[str, Any]]
    uploadCustos: Dict[str, Any]