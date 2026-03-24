# BI Manutencao

Projeto em duas frentes:
- Backend FastAPI para importacao e exposicao do dashboard de chamados corretivos.
- Frontend Next.js para visualizacao do JSON tratado persistido no banco.

## Configuracao rapida de ambiente

1. Backend:
- Copie `backend/.env.example` para `backend/.env`.

2. Frontend:
- Copie `frontend/.env.example` para `frontend/.env.local`.

## Subir backend com Docker

```bash
docker compose up -d
```

API principal para o front:
- `GET http://localhost:8000/dashboard/manutencao`

## Rodar frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse:
- `http://localhost:3000/chamados`
