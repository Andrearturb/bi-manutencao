from typing import List, Dict, Any

from pydantic import BaseModel

from app.schemas.chamado import ChamadoResponse


class DashboardResponse(BaseModel):
    dados: List[ChamadoResponse]
    sla: Dict[str, Any]
    upload: Dict[str, Any]


class DashboardManutencaoResponse(BaseModel):
    dadosCorretivas: List[ChamadoResponse]
    dadosPreventivas: List[ChamadoResponse]
    uploadCorretivas: Dict[str, Any]
    uploadPreventivas: Dict[str, Any]


class DashboardCustosResponse(BaseModel):
    dadosCustos: List[Dict[str, Any]]
    uploadCustos: Dict[str, Any]