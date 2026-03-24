# BI Manutencao

Projeto em duas frentes:
- Backend FastAPI para importacao e exposicao do dashboard de chamados corretivos.
- Frontend Next.js para visualizacao do JSON tratado persistido no banco.

## Configuracao rapida de ambiente

1. Backend:
- Copie `backend/.env.example` para `backend/.env`.

2. Frontend:
- Copie `frontend/.env.example` para `frontend/.env.local`.

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
