"""Rotas de importação de planilhas e atualização das bases."""

from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedUser, require_import_permission
from app.db.session import SessionLocal
from app.services.importacao_custos_service import ImportacaoCustosService
from app.repositories.loja_referencia_repository import LojaReferenciaRepository
from app.schemas.importacao import ImportacaoResponse
from app.services.importacao_manutencao_service import ImportacaoManutencaoService
from app.services.loja_referencia_import_service import LojaReferenciaImportService

router = APIRouter(prefix="/importar", tags=["Importação"])


@router.post("/manutencao", response_model=ImportacaoResponse)
async def importar_manutencao(
    tipo: Literal["corretiva", "preventiva"] = Query(...),
    arquivo: UploadFile = File(...),
    _: AuthenticatedUser = Depends(require_import_permission),
) -> ImportacaoResponse:
    """Importa uma planilha de manutenção corretiva ou preventiva."""

    if not arquivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Arquivo inválido. Envie um Excel.")

    db: Session = SessionLocal()

    try:
        service = ImportacaoManutencaoService(db)
        return await service.executar(arquivo, tipo)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/lojas", response_model=ImportacaoResponse)
async def importar_base_lojas(
    arquivo: UploadFile = File(...),
    _: AuthenticatedUser = Depends(require_import_permission),
) -> ImportacaoResponse:
    """Importa a base de lojas de referência a partir de uma planilha."""

    if not arquivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Arquivo inválido. Envie um Excel.")

    db: Session = SessionLocal()
    try:
        conteudo = await arquivo.read()
        service = LojaReferenciaImportService()
        registros = service.ler_registros(conteudo)

        repository = LojaReferenciaRepository(db)
        repository.substituir_todas(registros)

        return ImportacaoResponse(
            mensagem="Base de lojas importada com sucesso.",
            total_registros=len(registros),
            nome_arquivo=arquivo.filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/referencias", response_model=ImportacaoResponse)
async def importar_referencias(
    tipo: Literal["base_lojas"] = Query(...),
    arquivo: UploadFile = File(...),
    _: AuthenticatedUser = Depends(require_import_permission),
) -> ImportacaoResponse:
    """Importa referências de lojas usando o mesmo fluxo da base de lojas."""

    if not arquivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Arquivo inválido. Envie um Excel.")

    if tipo != "base_lojas":
        raise HTTPException(status_code=400, detail="Tipo de referencia invalido.")

    db: Session = SessionLocal()
    try:
        conteudo = await arquivo.read()
        service = LojaReferenciaImportService()
        registros = service.ler_registros(conteudo)

        repository = LojaReferenciaRepository(db)
        repository.substituir_todas(registros)

        return ImportacaoResponse(
            mensagem="Base de lojas importada com sucesso.",
            total_registros=len(registros),
            nome_arquivo=arquivo.filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/custos", response_model=ImportacaoResponse)
async def importar_custos(
    tipo: Literal["custos"] = Query(...),
    arquivo: UploadFile = File(...),
    _: AuthenticatedUser = Depends(require_import_permission),
) -> ImportacaoResponse:
    """Importa uma planilha de custos e atualiza o cache consolidado."""

    if not arquivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Arquivo inválido. Envie um Excel.")

    if tipo != "custos":
        raise HTTPException(status_code=400, detail="Tipo de importacao de custos invalido.")

    db: Session = SessionLocal()
    try:
        service = ImportacaoCustosService(db)
        return await service.executar(arquivo)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()