"""Rotas de consulta e mapeamento da base de lojas de referência."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedUser, require_authenticated_user
from app.db.session import SessionLocal
from app.repositories.loja_referencia_repository import LojaReferenciaRepository
from app.schemas.loja_referencia import (
    LojaMapeamentoItem,
    LojaMapeamentoRequest,
    LojaMapeamentoResponse,
    LojaReferenciaResponse,
)

router = APIRouter(prefix="/referencias", tags=["Referencias"])


@router.get("/lojas", response_model=list[LojaReferenciaResponse])
def listar_lojas_referencia(
    _: AuthenticatedUser = Depends(require_authenticated_user),
) -> list[LojaReferenciaResponse]:
    """Lista todas as lojas de referência cadastradas."""

    db: Session = SessionLocal()
    try:
        repository = LojaReferenciaRepository(db)
        lojas = repository.listar_todas()
        return [
            LojaReferenciaResponse(
                sap=loja.sap,
                nome_loja=loja.nome_loja,
                praca=loja.praca,
                cnpj_loja=loja.cnpj_loja,
                ativo=loja.ativo,
            )
            for loja in lojas
        ]
    finally:
        db.close()


@router.get("/lojas/{sap}", response_model=LojaReferenciaResponse)
def obter_loja_referencia_por_sap(
    sap: str,
    _: AuthenticatedUser = Depends(require_authenticated_user),
) -> LojaReferenciaResponse:
    """Busca uma loja de referência pelo código SAP informado."""

    db: Session = SessionLocal()
    try:
        repository = LojaReferenciaRepository(db)
        loja = repository.obter_por_sap(_normalizar_sap(sap))
        if loja is None:
            raise HTTPException(status_code=404, detail="SAP nao encontrado na base de lojas.")

        return LojaReferenciaResponse(
            sap=loja.sap,
            nome_loja=loja.nome_loja,
            praca=loja.praca,
            cnpj_loja=loja.cnpj_loja,
            ativo=loja.ativo,
        )
    finally:
        db.close()


@router.post("/lojas/mapear-sap", response_model=LojaMapeamentoResponse)
def mapear_saps_em_lojas(
    payload: LojaMapeamentoRequest,
    _: AuthenticatedUser = Depends(require_authenticated_user),
) -> LojaMapeamentoResponse:
    """Mapeia uma lista de SAPs para dados de lojas conhecidas."""

    db: Session = SessionLocal()
    try:
        saps_normalizados = [_normalizar_sap(sap) for sap in payload.saps if _normalizar_sap(sap)]
        repository = LojaReferenciaRepository(db)
        lojas_por_sap = repository.obter_por_saps(saps_normalizados)

        itens: list[LojaMapeamentoItem] = []
        for sap in payload.saps:
            sap_normalizado = _normalizar_sap(sap)
            loja = lojas_por_sap.get(sap_normalizado)
            if loja is None:
                itens.append(
                    LojaMapeamentoItem(
                        sap=sap_normalizado,
                        encontrado=False,
                    )
                )
                continue

            itens.append(
                LojaMapeamentoItem(
                    sap=sap_normalizado,
                    encontrado=True,
                    nome_loja=loja.nome_loja,
                    praca=loja.praca,
                    cnpj_loja=loja.cnpj_loja,
                )
            )

        return LojaMapeamentoResponse(itens=itens)
    finally:
        db.close()


def _normalizar_sap(valor: str) -> str:
    """Normaliza um SAP removendo espaços e sufixo decimal do Excel."""

    texto = (valor or "").strip()
    if not texto:
        return ""

    # Excel pode enviar SAP como numero decimal (ex.: 4052.0).
    if texto.endswith(".0") and texto.replace(".", "", 1).isdigit():
        texto = texto[:-2]

    return texto
