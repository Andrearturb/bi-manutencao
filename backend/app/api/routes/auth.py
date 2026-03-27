from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import (
    AuthenticatedUser,
    can_user_import,
    create_local_access_token,
    get_db,
    get_current_user,
    require_admin_principal,
    validate_local_credentials,
)
from app.core.config import settings
from app.repositories.import_permission_repository import ImportPermissionRepository
from app.schemas.auth import (
    AuthModeResponse,
    CurrentUserResponse,
    ImportPermissionListResponse,
    LocalLoginRequest,
    LocalLoginResponse,
    ImportPermissionRequest,
    ImportPermissionResponse,
    UserAccessListResponse,
    UserAccessResponse,
)

router = APIRouter(prefix="/auth", tags=["Autenticacao"])


@router.get("/mode", response_model=AuthModeResponse)
def get_auth_mode() -> AuthModeResponse:
    return AuthModeResponse(auth_mode=settings.auth_mode_normalized)


@router.post("/local/login", response_model=LocalLoginResponse)
def local_login(payload: LocalLoginRequest) -> LocalLoginResponse:
    if settings.auth_mode_normalized != "local":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login local desabilitado neste ambiente.",
        )

    email = payload.email.strip().lower()

    if not validate_local_credentials(email, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas.",
        )

    token = create_local_access_token(email)
    return LocalLoginResponse(access_token=token)


@router.get("/me", response_model=CurrentUserResponse)
def me(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    return CurrentUserResponse(
        email=user.email,
        is_admin_principal=user.is_admin_principal,
        can_import=can_user_import(user, db),
    )


@router.get("/import-permissions", response_model=ImportPermissionListResponse)
def list_import_permissions(
    _: AuthenticatedUser = Depends(require_admin_principal),
    db: Session = Depends(get_db),
) -> ImportPermissionListResponse:
    repository = ImportPermissionRepository(db)
    rows = repository.list_all()
    items = [
        ImportPermissionResponse(email=row.email, granted_by=row.granted_by)
        for row in rows
    ]
    return ImportPermissionListResponse(items=items)


@router.get("/users", response_model=UserAccessListResponse)
def list_users(
    _: AuthenticatedUser = Depends(require_admin_principal),
    db: Session = Depends(get_db),
) -> UserAccessListResponse:
    repository = ImportPermissionRepository(db)
    permission_rows = repository.list_all()
    permission_emails = {row.email.strip().lower() for row in permission_rows}

    known_emails = set(settings.local_users_map.keys())
    known_emails.update(permission_emails)
    known_emails.add(settings.admin_principal_email_normalized)

    items = [
        UserAccessResponse(
            email=email,
            is_admin_principal=email == settings.admin_principal_email_normalized,
            can_import=(
                email == settings.admin_principal_email_normalized
                or email in permission_emails
            ),
        )
        for email in sorted(known_emails)
    ]

    return UserAccessListResponse(items=items)


@router.post("/import-permissions", response_model=ImportPermissionResponse)
def grant_import_permission(
    payload: ImportPermissionRequest,
    admin_user: AuthenticatedUser = Depends(require_admin_principal),
    db: Session = Depends(get_db),
) -> ImportPermissionResponse:
    email = payload.email.strip().lower()
    repository = ImportPermissionRepository(db)

    if repository.exists_for_email(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail ja possui permissao de importacao.",
        )

    created = repository.create(email=email, granted_by=admin_user.email)
    return ImportPermissionResponse(email=created.email, granted_by=created.granted_by)


@router.delete("/import-permissions/{email}")
def revoke_import_permission(
    email: str,
    _: AuthenticatedUser = Depends(require_admin_principal),
    db: Session = Depends(get_db),
) -> dict:
    normalized_email = email.strip().lower()
    repository = ImportPermissionRepository(db)
    deleted = repository.delete_by_email(normalized_email)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permissao nao encontrada para este e-mail.",
        )

    return {"mensagem": "Permissao removida com sucesso."}
