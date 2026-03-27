from pydantic import BaseModel


class CurrentUserResponse(BaseModel):
    email: str
    is_admin_principal: bool
    can_import: bool


class ImportPermissionRequest(BaseModel):
    email: str


class ImportPermissionResponse(BaseModel):
    email: str
    granted_by: str


class ImportPermissionListResponse(BaseModel):
    items: list[ImportPermissionResponse]


class LocalLoginRequest(BaseModel):
    email: str
    password: str


class LocalLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthModeResponse(BaseModel):
    auth_mode: str


class UserAccessResponse(BaseModel):
    email: str
    is_admin_principal: bool
    can_import: bool


class UserAccessListResponse(BaseModel):
    items: list[UserAccessResponse]
