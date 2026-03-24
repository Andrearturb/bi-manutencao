from typing import List, Dict, Any

from pydantic import BaseModel

from app.schemas.chamado import ChamadoResponse


class DashboardResponse(BaseModel):
    dados: List[ChamadoResponse]
    sla: Dict[str, Any]
    upload: Dict[str, Any]