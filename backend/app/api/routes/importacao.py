from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedUser, require_import_permission
from app.db.session import SessionLocal
from app.schemas.importacao import ImportacaoResponse
from app.services.importacao_manutencao_service import ImportacaoManutencaoService

router = APIRouter(prefix="/importar", tags=["Importação"])


@router.post("/manutencao", response_model=ImportacaoResponse)
async def importar_manutencao(
    arquivo: UploadFile = File(...),
    _: AuthenticatedUser = Depends(require_import_permission),
) -> ImportacaoResponse:
    if not arquivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Arquivo inválido. Envie um Excel.")

    db: Session = SessionLocal()

    try:
        service = ImportacaoManutencaoService(db)
        return await service.executar(arquivo)
    finally:
        db.close()