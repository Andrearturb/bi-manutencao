# BI Manutencao

Projeto em duas frentes:
- Backend FastAPI para importacao e exposicao do dashboard de chamados corretivos.
- Frontend Next.js para visualizacao do JSON tratado persistido no banco.

## Autenticacao e permissoes

- O projeto suporta dois modos: `local` (desenvolvimento) e `microsoft`.
- No modo `local`, o login usa e-mail/senha definidos em `LOCAL_USERS`.
- No modo `microsoft`, o backend valida o token JWT emitido pelo Microsoft Entra ID (Azure AD).
- Para importar planilhas, o usuario precisa de permissao especial.
- O `ADMIN_PRINCIPAL_EMAIL` pode conceder e revogar liberacoes em `/admin/importacao`.

## Configuracao rapida de ambiente

1. Backend:
- Copie `backend/.env.example` para `backend/.env`.

2. Frontend:
- Copie `frontend/.env.example` para `frontend/.env.local`.

3. Configure autenticacao local para desenvolvimento:
- `AUTH_MODE=local`
- `ADMIN_PRINCIPAL_EMAIL`
- `LOCAL_USERS` (exemplo: `admin@local.test:admin123;analista@local.test:analista123`)

4. Para usar Microsoft depois, troque para `AUTH_MODE=microsoft` e preencha:
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `NEXT_PUBLIC_AZURE_TENANT_ID`
- `NEXT_PUBLIC_AZURE_CLIENT_ID`

## Rodar com Docker (Recomendado)

Suba a stack completa (Postgres + Backend + Frontend):

```bash
docker compose up -d
```

Acesse:
- Frontend: `http://localhost:3000/chamados`
- Backend API: `http://localhost:8000/dashboard/manutencao`
- API Docs: `http://localhost:8000/docs`

Para parar:
```bash
docker compose down
```

## Rodar localmente (Desenvolvimento)

### Backend com Docker

```bash
docker compose up -d
```

### Frontend em modo desenvolvimento

```bash
cd frontend
npm install
npm run dev
```

Acesse:
- `http://localhost:3000/chamados`
- API: `http://localhost:8000/dashboard/manutencao`
