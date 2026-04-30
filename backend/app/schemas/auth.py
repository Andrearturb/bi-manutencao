"""Esquemas de validação de dados de autenticação."""

from pydantic import BaseModel


class CurrentUserResponse(BaseModel):
    """Resposta com informações do usuário autenticado."""

    email: str
    is_admin_principal: bool
    can_import: bool


class ImportPermissionRequest(BaseModel):
    """Requisição para conceder permissão de importação a um usuário."""

    email: str


class ImportPermissionResponse(BaseModel):
    """Resposta com detalhes de uma permissão de importação."""

    email: str
    granted_by: str


class ImportPermissionListResponse(BaseModel):
    """Resposta com lista de permissões de importação."""

    items: list[ImportPermissionResponse]


class LocalLoginRequest(BaseModel):
    """Requisição de login para autenticação local."""

    email: str
    password: str


class LocalLoginResponse(BaseModel):
    """Resposta de login com token de acesso."""

    access_token: str
    token_type: str = "bearer"


class AuthModeResponse(BaseModel):
    """Resposta indicando o modo de autenticação configurado."""

    auth_mode: str


class UserAccessResponse(BaseModel):
    """Resposta com informações de acesso de um usuário."""

    email: str
    is_admin_principal: bool
    can_import: bool


class UserAccessListResponse(BaseModel):
    """Resposta com lista de acesso de usuários."""

    items: list[UserAccessResponse]
