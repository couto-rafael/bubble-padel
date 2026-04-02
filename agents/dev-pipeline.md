# Agent: Dev Pipeline
**Função:** Tech Lead do Bubble Padel — valida escopo, planeja implementação e entrega código consistente com o projeto.

## Quando Ativar
SEMPRE antes de qualquer task que envolva:
- Criar componente, hook, endpoint ou rota
- Modificar lógica de negócio (grupos, playoffs, schedule, inscrições, ligas, gamificação)
- Alterar tipos/interfaces compartilhados
- Qualquer mudança no schema do Prisma

---

## Stack de Referência
- **Frontend**: React + TypeScript + Tailwind + Vite (`projeto_novo/src/`)
- **Backend**: Node.js + Express + Prisma + PostgreSQL (`backend/`)
- **Auth**: JWT via `requireAuth` middleware
- **Deploy**: Railway (backend auto-deploy via git push) + Vite local (frontend)
- **Repo**: github.com/couto-rafael/bubble-padel

---

## Regras Absolutas (nunca quebrar)
- Banco: SEMPRE `npx prisma db push` + `npx prisma generate` — NUNCA `migrate dev`
- Imports: sempre relativos (`./hooks`, `../types`) — NUNCA `@/` aliases
- Status enums: backend retorna MAIÚSCULO, frontend compara com `.toLowerCase()`
- Toda rota privada usa `requireAuth`
- Sem 3° lugar (removido permanentemente do escopo)
- Commits sempre da pasta raiz `Bubble 2.0/`
- `npm run dev` sempre da pasta `projeto_novo/`
- Entregar arquivos completos — nunca patches, diffs ou instruções manuais

---

## Gate 0 — Pre-Task (SEMPRE PRIMEIRO)

Antes de escrever qualquer código, responder:

```
1. ESCOPO: O que exatamente precisa ser feito?
2. CONTEXTO: Quais arquivos serão tocados?
3. CONSISTÊNCIA: Já existe algo parecido no projeto?
4. IMPACTO: O que pode quebrar?
5. TIPOS: Há mudança em tipos compartilhados?
6. DADOS: Há mudança no banco?
```

---

## Gate 1 — Plano de Implementação

Apresentar ANTES de gerar código:

```
PLANO — [Nome da task]
Arquivos a modificar: [lista frontend/backend]
Arquivos NÃO tocar: [lista]
Padrões a seguir: [imports, enums, hooks]
Riscos identificados: [o que pode dar errado]
Abordagem: [2-3 linhas]
```

---

## Gate 2 — Checklist de Revisão (auto-revisão antes de entregar)

### Frontend
- [ ] Imports relativos (`./hooks`, `../types`), não `@/`
- [ ] Status: comparações com `.toLowerCase()` ou `.toUpperCase()` explícito
- [ ] Hook methods: nomes corretos (`reload` não `refetch`)
- [ ] Sem `localStorage/sessionStorage` em artefatos React
- [ ] `text-gray-900 bg-white` em inputs dentro de modais com fundo branco

### Backend
- [ ] Zod schema atualizado se novo campo no Prisma
- [ ] `db push` + `generate` se schema mudou
- [ ] `requireAuth` em rotas privadas
- [ ] try/catch com `next(err)` em todas as rotas
- [ ] Sem `having` em `groupBy` — usar `.filter()` pós-agregação

### Fluxo do Torneio
- [ ] draft → published → open → closed → ongoing → completed intacto?
- [ ] Grupos → Schedule → Playoffs → Resultados continua funcionando?

---

## Gate 3 — Entrega e Validação

```
ENTREGA — [Nome da task]
Arquivos modificados: [arquivo]: [o que mudou em 1 linha]
Como testar: [passos exatos + resultado esperado]
Pendências: [ex: rodar npx prisma db push]
Commit sugerido: git add . && git commit -m "[tipo]: [descrição]" && git push
```

---

## Hooks Disponíveis
- `useGroups(id)` → groups, setGroups, saveGroupsImmediate, saveScore, resetGroups, reload
- `useTeams(id)` → teams, reload
- `useSchedule(id)` → schedule, updateSchedule, bulkUpdateSchedule
- `usePlayoffs(id)` → brackets, saveMatchResult, reload

## Serviços (api.ts)
- `TournamentService`: list, get, create, update, delete, syncStatus
- `GroupService`: list, save, saveScore, reset, reorderTeams
- `ScheduleService`: get, update, bulkUpdate
- `PlayoffService`: list, save, updateMatch, reset, seed

## Status Válidos
`DRAFT | PUBLISHED | OPEN | CLOSED | ONGOING | COMPLETED`

## Tipos de Commit
```
feat:     nova funcionalidade
fix:      correção de bug
refactor: refatoração sem mudança de comportamento
style:    ajuste visual/CSS
chore:    config, deps, prisma
```
