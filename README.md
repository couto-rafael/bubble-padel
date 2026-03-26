# 🫧 Bubble Padel

Plataforma fullstack de gestão de torneios de padel — clubes, grupos, playoffs e resultados em um só lugar.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Tailwind + Vite |
| Backend | Node.js + Express |
| ORM | Prisma |
| Banco | PostgreSQL |
| Auth | JWT via middleware `requireAuth` |
| Deploy | Railway (backend) + Vite local (frontend) |

---

## Estrutura do projeto

```
bubble-padel/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── index.ts
│   └── package.json
│
└── projeto_novo/
    └── src/
        ├── components/
        ├── hooks/
        ├── pages/
        ├── services/
        │   └── api.ts
        ├── types/
        │   └── index.ts
        └── main.tsx
```

---

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente ou via Railway
- `.env` configurado (ver abaixo)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

```bash
cd projeto_novo
npm install
npm run dev
```

---

## Variáveis de ambiente

### `backend/.env`

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=seu_secret_aqui
PORT=3000
```

---

## Banco de dados

> ⚠️ **Regra absoluta**: sempre usar `npx prisma db push` + `npx prisma generate`.  
> **NUNCA** usar `npx prisma migrate dev` — reseta o banco no Railway.

```bash
# Após qualquer alteração no schema.prisma:
npx prisma db push
npx prisma generate
```

---

## Status do torneio

O fluxo de status segue esta ordem obrigatória:

```
DRAFT → PUBLISHED → OPEN → CLOSED → ONGOING → COMPLETED
```

- Backend retorna status em **MAIÚSCULO**
- Frontend sempre compara com `.toLowerCase()`
- Ao enviar para o backend: `.toUpperCase()`
- `syncStatus` deve ser chamado após salvar qualquer placar

---

## Fluxo principal

```
Inscrições → Grupos → Schedule → Playoffs → Resultados
```

1. **Grupos**: times divididos em grupos, partidas geradas automaticamente
2. **Schedule**: calendário de jogos com horários por rodada
3. **Playoffs**: bracket gerado via algoritmo snake-and-swap (times do mesmo grupo não se encontram antes da final)
4. **Resultados**: placares sincronizados via `ScoreModal` unificado

> Sem disputa de 3° lugar — removida permanentemente do escopo.

---

## Hooks principais

```ts
useGroups(tournamentId)
// → groups, setGroups, saveGroupsImmediate, saveScore, resetGroups, reload

useTeams(tournamentId)
// → teams, reload

useSchedule(tournamentId)
// → schedule, updateSchedule, bulkUpdateSchedule

usePlayoffs(tournamentId)
// → brackets, saveMatchResult, reload
```

---

## Serviços (api.ts)

```ts
TournamentService  // list, get, create, update, delete, syncStatus
GroupService       // list, save, saveScore, reset, reorderTeams
ScheduleService    // get, update, bulkUpdate
PlayoffService     // list, save, updateMatch, reset, seed
```

---

## Padrões de código

- Imports sempre **relativos** (`./hooks`, `../types`) — nunca `@/` (quebra em Windows/OneDrive)
- Toda rota privada usa o middleware `requireAuth`
- Sem `any` desnecessário no TypeScript
- Try/catch com `next(err)` em todas as rotas do Express

---

## Convenção de commits

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: refatoração sem mudança de comportamento
style:    ajuste visual/CSS
chore:    config, deps, prisma
```

---

## Features

### ✅ Concluídas
- Autenticação JWT
- CRUD de torneios
- Geração e edição de grupos
- Dashboard do clube
- Schedule persistente com horários
- Sincronização de placares
- Bracket de playoffs completo (snake-and-swap)
- ScoreModal unificado (grupos + playoffs)

### 🔜 Pendentes
- Inscrição pública em torneios
- Perfis de clubes
- Perfis de atletas

---

## Deploy

O backend faz deploy automático no Railway a cada `git push` na branch `main`.

```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

Health check: `GET https://bubble-padel-production.up.railway.app/health`
