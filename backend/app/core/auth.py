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


@dataclass
class AuthenticatedUser:
    email: str
    is_admin_principal: bool


security = HTTPBearer(auto_error=False)
LOCAL_TOKEN_ISSUER = "bi-manutencao-local"


def _normalize_email(email: str) -> str:
    return email.strip().lower()


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    return jwt.PyJWKClient(
        f"https://login.microsoftonline.com/{settings.azure_tenant_id}/discovery/v2.0/keys"
    )


def _decode_token(token: str) -> dict:
    if settings.auth_mode_normalized == "local":
        return _decode_local_token(token)

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


def create_local_access_token(email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "email": email,
        "iss": LOCAL_TOKEN_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=8)).timestamp()),
    }
    return jwt.encode(payload, settings.local_auth_secret_key, algorithm="HS256")


def validate_local_credentials(email: str, password: str) -> bool:
    users = settings.local_users_map
    return users.get(email.strip().lower()) == password


def get_db() -> Iterator[Session]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao nao informado.",
        )

    payload = _decode_token(credentials.credentials)
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

    email = _normalize_email(raw_email)
    is_admin_principal = email == settings.admin_principal_email_normalized

    return AuthenticatedUser(email=email, is_admin_principal=is_admin_principal)


def can_user_import(user: AuthenticatedUser, db: Session) -> bool:
    if user.is_admin_principal:
        return True

    repository = ImportPermissionRepository(db)
    return repository.exists_for_email(user.email)


def require_import_permission(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    if can_user_import(user, db):
        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Usuario sem permissao para importar planilhas.",
    )


def require_authenticated_user(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    return user


def require_admin_principal(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    if user.is_admin_principal:
        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Somente o admin principal pode gerir liberacoes.",
    )
