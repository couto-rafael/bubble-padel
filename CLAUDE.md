# CLAUDE.md — Bubble Padel

Arquivo de contexto para o Claude Code CLI e claude.ai. Lido automaticamente a cada sessão.

## Context Navigation

1. SEMPRE consulte o knowledge graph primeiro
2. Só leia arquivos brutos se eu pedir explicitamente
3. Use graphify-out/wiki/index.md como ponto de entrada

## Estilo de resposta

- Sem palavras de preenchimento (the, is, am, are)
- Respostas diretas apenas
- Frases curtas: 3–6 palavras
- Executar ferramentas primeiro, mostrar resultado, parar
- Sem narração

Workflow Orchestration

1. Plan Node Default
   Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
   If something goes sideways, stop pre-plan immediately — don’t keep pushing
   Use plan mode for verification steps, not just building
   Write detailed specs upfront to reduce ambiguity
2. Subagent Strategy
   Use subagents liberally to keep main context window clean
   Offload research, exploration, and parallel analysis to subagents
   For complex problems, throw more compute at it via subagents
   One task per subagent for focused execution
3. Self-Improvement Loop
   After ANY correction from the user: update tasks/lessons.md with the pattern
   Write rules for yourself that prevent the same mistake
   Ruthlessly iterate on these lessons until mistake rate drops
   Review lessons at session start for relevant project
4. Verification Before Done
   Never mark a task complete without proving it works
   Diff behavior between main and your changes when relevant
   Ask yourself: “Would a staff engineer approve this?”
   Run tests, check logs, demonstrate correctness
5. Demand Elegance (Balanced)
   For non-trivial changes: pause and ask “Is there a more elegant way?”
   If a fix feels hacky: “Knowing everything I know now, implement the elegant solution”
   Skip this for simple, obvious fixes — don’t over-engineer
   Challenge your own work before presenting it
6. Autonomous Bug Fixing
   When given a bug report: just fix it. Don’t ask for hand-holding
   Point at logs, errors, failing tests — then resolve them
   Zero context switching required from the user
   Go fix failing CI tests without being told how
   Task Management
   Plan First: Write plan to tasks/todo.md with checkable items
   Verify Plan: Check in before starting implementation
   Track Progress: Mark items complete as you go
   Explain Changes: High-level summary at each step
   Document Results: Add review section to tasks/todo.md
   Capture Lessons: Update tasks/lessons.md after corrections
   Core Principles
   Simplicity First: Make every change as simple as possible. Impact minimal code
   No Laziness: Find root causes. No temporary fixes. Senior developer standards
   Minimize Impact: Changes should only touch what’s necessary. Avoid introducing bugs

---

## Prisma transactions + Neon/pgBouncer

Default interactive transaction timeout (5000ms) é insuficiente com pooler serverless (~200-300ms por query de latência).

Para transações com 3+ creates sequenciais, sempre passar:

```ts
prisma.$transaction(fn, { timeout: 30000 });
```

Regras adicionais:

- Nunca chamar `bcrypt.hashSync` dentro da transação — é CPU-blocking e consome o timeout. Pré-computar todos os hashes **antes** de abrir a transação.
- Seed scripts em `backend/scripts/` usam `tsx` direto (fora do `rootDir: src` do tsconfig) — não precisam de compilação.
- Backend corre na porta `3001` (default). Configurável via `PORT` env var.

---

## Stack

- **Frontend**: React + TypeScript + Tailwind + Vite — `projeto_novo/src/` — porta 5173
- **Backend**: Node.js + Express + Prisma + PostgreSQL — `backend/src/`
- **Auth**: JWT via middleware `requireAuth`
- **Deploy**: Railway (backend, auto-deploy via git push) + Vite local (frontend)
- **Banco**: Neon (PostgreSQL free tier), pooler port 6543 com `sslmode=require`
- **Pagamentos**: AbacatePay (PIX)
- **Emails**: Resend (free tier, apenas endereços verificados até domínio confirmado)
- **Monitoramento**: Sentry + UptimeRobot (`/api/health`)
- **Repo**: github.com/couto-rafael/bubble-padel
- **Raiz local**: `C:\Apps\Bubble 2.0\`

---

## North Star Metric

**Torneios pagos completados/mês.**

Métrica única que combina:

- Volume real (clube ativo criando torneio)
- Monetização (PIX processado)
- Conclusão (torneio rodou do início ao fim sem clube abandonar)

Priorização de features segue esta métrica. Se uma proposta não move
o NSM em prazo previsível, questionar antes de construir.

Health metrics (não pode piorar): uptime, bounce rate email, erros
Sentry, NPS, taxa de conclusão de torneio.

Baseline coletado via `npm run kpi:snapshot` (S10-T12).
Cadência de revisão: 1ª segunda-feira de cada mês.

## Regras Absolutas (nunca quebrar)

- Banco: SEMPRE `npx prisma db push` + `npx prisma generate` — **NUNCA** `migrate dev`
- Imports: sempre relativos (`./hooks`, `../types`) — **NUNCA** `@/` aliases
- Status enums: backend retorna MAIÚSCULO, frontend compara com `.toLowerCase()` ou `.toUpperCase()`
- Toda rota privada usa `requireAuth`
- Sem 3° lugar (removido permanentemente do escopo)
- Commits sempre da pasta raiz `Bubble 2.0/`
- `npm run dev` sempre da pasta `projeto_novo/`
- Datas: sempre append `T12:00:00` antes de construir `Date` objects (evita UTC midnight shift no Brasil UTC-3)
- **Entrega**: arquivos completos reescritos — nunca patches, diffs ou instruções manuais
- **Edição**: só altere o que foi solicitado — zero refatoração não solicitada

---

## Dev Pipeline (7 Gates)

### Gate 0 — Pre-Task (SEMPRE PRIMEIRO)

Antes de escrever qualquer código:

1. **ESCOPO**: O que exatamente precisa ser feito?
2. **CONTEXTO**: Quais arquivos serão tocados?
3. **CONSISTÊNCIA**: Já existe algo parecido no projeto?
4. **IMPACTO**: O que pode quebrar?
5. **TIPOS**: Há mudança em tipos compartilhados?
6. **DADOS**: Há mudança no banco?

### Gate 1 — Plano de Implementação

Apresentar ANTES de gerar código:

```
PLANO — [Nome da task]
Arquivos a modificar: [lista frontend/backend]
Arquivos NÃO tocar: [lista]
Padrões a seguir: [imports, enums, hooks]
Riscos identificados: [o que pode dar errado]
Abordagem: [2-3 linhas]
```

### Gate 2 — Checklist de Revisão (auto-revisão antes de entregar)

**Frontend**

- [ ] Imports relativos (`./hooks`, `../types`), não `@/`
- [ ] Status: comparações com `.toLowerCase()` ou `.toUpperCase()` explícito
- [ ] Hook methods: nomes corretos (`reload` não `refetch`)
- [ ] `text-gray-900 bg-white` em inputs dentro de modais com fundo branco

**Backend**

- [ ] Zod schema atualizado se novo campo no Prisma
- [ ] `db push` + `generate` se schema mudou
- [ ] `requireAuth` em rotas privadas
- [ ] try/catch com `next(err)` em todas as rotas
- [ ] Sem `having` em `groupBy` — usar `.filter()` pós-agregação

**Fluxo do torneio**

- [ ] draft → published → open → closed → ongoing → completed intacto?
- [ ] Grupos → Schedule → Playoffs → Resultados continua funcionando?

### Gate 3 — Entrega e Validação

```
ENTREGA — [Nome da task]
Arquivos modificados: [arquivo]: [o que mudou em 1 linha]
Como testar: [passos exatos + resultado esperado]
Pendências: [ex: rodar npx prisma db push]
Commit sugerido: git add . && git commit -m "[tipo]: [descrição]" && git push
```

Gates 4–7 (Design, Revisão de Especialistas, QA, Aprovação humana) — ver `/agents/review-pipeline.md`.

---

## Hooks Disponíveis

| Hook              | Retorna                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `useGroups(id)`   | groups, setGroups, saveGroupsImmediate, saveScore, resetGroups, reload |
| `useTeams(id)`    | teams, reload                                                          |
| `useSchedule(id)` | schedule, updateSchedule, bulkUpdateSchedule                           |
| `usePlayoffs(id)` | brackets, saveMatchResult, reload                                      |

---

## Serviços (api.ts)

| Serviço             | Métodos                                       |
| ------------------- | --------------------------------------------- |
| `TournamentService` | list, get, create, update, delete, syncStatus |
| `GroupService`      | list, save, saveScore, reset, reorderTeams    |
| `ScheduleService`   | get, update, bulkUpdate                       |
| `PlayoffService`    | list, save, updateMatch, reset, seed          |

---

## Status Válidos

```
DRAFT | PUBLISHED | OPEN | CLOSED | ONGOING | COMPLETED
```

Fluxo: `draft → published → open → closed → ongoing → completed`

`syncStatus` deve ser chamado após salvar placares.

---

## Design System

- **Background**: `#0a0e27` (dark navy)
- **Primary**: `#00ff88` (neon green)
- **Secondary**: `#00ccff` (cyan)
- **Tipografia**: Plus Jakarta Sans (Syne rejeitada — legibilidade ruim em números)
- **Estratégia dark/light**: dark seletivo — apenas Trophy Room, League pages, Live scoring, Results; light para todo o restante

---

## Fluxo do Torneio

```
Grupos → Schedule → Playoffs → Resultados
```

Seeding de playoffs: algoritmo "snake-and-swap" — impede times do mesmo grupo antes da final.

---

## Tipos de Commit

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: refatoração sem mudança de comportamento
style:    ajuste visual/CSS
chore:    config, deps, prisma
```

---

## Agentes de Suporte

Todos em `/agents/`:

| Arquivo              | Função                                               |
| -------------------- | ---------------------------------------------------- |
| `dev-pipeline.md`    | Tech Lead — gates 0–3, regras, hooks, serviços       |
| `review-pipeline.md` | Orquestrador de revisão — gates 4–7, release         |
| `ui-specialist.md`   | Head of Design — design gate, paleta, padrões        |
| `specialists.md`     | Gamification · Legal · Monetization · Product · Copy |
| `mcp-setup.md`       | MCP GitHub, Figma, Railway                           |

---

## Monetização

- Modelo: comissão por atleta inscrito
- Lançamento: `COMMISSION_PER_ATHLETE = 0` ("Grátis durante o lançamento")
- PIX vai direto para a wallet AbacatePay do clube
- Responsabilidade de reembolso: clube (Bubble = intermediário tecnológico)

---

## Serviços Externos

| Serviço     | Uso                                                                     |
| ----------- | ----------------------------------------------------------------------- |
| AbacatePay  | PIX — sandbox key `abc_dev_eZQSwFzbkQWQEagRyQ0AJ40S`; produção pendente |
| Resend      | Emails — free tier, só endereços verificados até domínio aprovado       |
| Railway     | Hobby $5/mês — backend only                                             |
| Neon        | PostgreSQL free tier — pooler port 6543                                 |
| Sentry      | Error monitoring — condicional em `SENTRY_DSN` env var                  |
| UptimeRobot | Monitora `/api/health`                                                  |
| GitHub      | `couto-rafael/bubble-padel`                                             |
