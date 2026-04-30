"""Dependências de autenticação e autorização para rotas FastAPI."""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any, Iterator

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.repositories.import_permission_repository import ImportPermissionRepository

LOCAL_TOKEN_ISSUER = "bi-manutencao-local"
security = HTTPBearer(auto_error=False)


@dataclass
class AuthenticatedUser:
    """Contexto de usuário autenticado injetado em endpoints protegidos."""

    email: str
    is_admin_principal: bool


def _normalize_email(email: str) -> str:
    """Normaliza valores de e-mail para formato canônico."""
    return email.strip().lower()


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    """Retorna um cliente JWKS em cache para validação de token Microsoft."""
    return jwt.PyJWKClient(
        f"https://login.microsoftonline.com/{settings.azure_tenant_id}/discovery/v2.0/keys"
    )


def _decode_microsoft_token(token: str) -> dict[str, Any]:
    """Decodifica e valida um token JWT do Microsoft Entra ID."""
    issuer = f"https://login.microsoftonline.com/{settings.azure_tenant_id}/v2.0"
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.azure_client_id,
            issuer=issuer,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Microsoft invalido.",
        ) from exc


def _decode_local_token(token: str) -> dict[str, Any]:
    """Decodifica e valida um token JWT local."""
    try:
        return jwt.decode(
            token,
            settings.local_auth_secret_key,
            algorithms=["HS256"],
            issuer=LOCAL_TOKEN_ISSUER,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token local invalido.",
        ) from exc


def _decode_token(token: str) -> dict[str, Any]:
    """Decodifica um token de acordo com o modo de autenticação configurado."""
    if settings.auth_mode_normalized == "local":
        return _decode_local_token(token)

    return _decode_microsoft_token(token)


def _extract_user_email(payload: dict[str, Any]) -> str:
    """Extrai e normaliza o e-mail do usuário do payload do token."""
    if settings.auth_mode_normalized == "local":
        raw_email = payload.get("sub") or payload.get("email")
    else:
        raw_email = (
            payload.get("preferred_username")
            or payload.get("email")
            or payload.get("upn")
        )

    if not isinstance(raw_email, str) or not raw_email.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token nao possui e-mail do usuario.",
        )

    return _normalize_email(raw_email)


def create_local_access_token(email: str) -> str:
    """Cria um token JWT local para autenticação em desenvolvimento."""
    normalized_email = _normalize_email(email)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": normalized_email,
        "email": normalized_email,
        "iss": LOCAL_TOKEN_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=8)).timestamp()),
    }
    return jwt.encode(payload, settings.local_auth_secret_key, algorithm="HS256")


def validate_local_credentials(email: str, password: str) -> bool:
    """Valida credenciais do modo local contra usuários configurados."""
    users = settings.local_users_map
    return users.get(_normalize_email(email)) == password


def get_db() -> Iterator[Session]:
    """Fornece uma sessão de banco de dados SQLAlchemy para injeção de dependência."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> AuthenticatedUser:
    """Retorna usuário autenticado baseado no token bearer do Authorization."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao nao informado.",
        )

    payload = _decode_token(credentials.credentials)
    email = _extract_user_email(payload)
    is_admin_principal = email == settings.admin_principal_email_normalized

    return AuthenticatedUser(email=email, is_admin_principal=is_admin_principal)


def can_user_import(user: AuthenticatedUser, db: Session) -> bool:
    """Verifica se um usuário pode importar dados de planilhas."""
    if user.is_admin_principal:
        return True

    repository = ImportPermissionRepository(db)
    return repository.exists_for_email(user.email)


def require_import_permission(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    """Dependência que reforça permissão de importação para o usuário atual."""
    if can_user_import(user, db):
        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Usuario sem permissao para importar planilhas.",
    )


def require_authenticated_user(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Dependência que requer apenas um usuário autenticado válido."""
    return user


def require_admin_principal(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Dependência que restringe acesso ao admin principal configurado."""
    if user.is_admin_principal:
        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Somente o admin principal pode gerir liberacoes.",
    )
