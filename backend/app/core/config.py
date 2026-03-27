from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BI Manutenção API"
    app_version: str = "0.1.0"
    database_url: str
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    auth_mode: str = "local"
    azure_tenant_id: str = ""
    azure_client_id: str = ""
    admin_principal_email: str
    local_auth_secret_key: str = "dev-local-secret-change-me"
    local_users: str = "admin@local.test:admin123"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def admin_principal_email_normalized(self) -> str:
        return self.admin_principal_email.strip().lower()

    @property
    def auth_mode_normalized(self) -> str:
        return self.auth_mode.strip().lower()

    @property
    def local_users_map(self) -> dict[str, str]:
        users: dict[str, str] = {}
        for chunk in self.local_users.split(";"):
            pair = chunk.strip()
            if not pair or ":" not in pair:
                continue

            email, password = pair.split(":", maxsplit=1)
            email_clean = email.strip().lower()
            password_clean = password.strip()
            if email_clean and password_clean:
                users[email_clean] = password_clean

        return users

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()