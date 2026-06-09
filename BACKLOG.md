# Bubble Padel — Backlog

Itens pendentes que não entraram na sprint atual. Cada item tem: prioridade, sprint sugerida, descrição.

## Validação / Backend

### Validação de gênero por categoria
- **Prioridade:** Alta
- **Sprint sugerida:** 9
- Bloquear inscrição quando gênero do atleta não bate com categoria. Masculino: só MALE. Feminino: só FEMALE. Mista: ambos. Validar backend (POST `/api/tournaments/:id/register`) e frontend (autocomplete filtrado). Pré-requisito: confirmar `Athlete.gender` no schema + backfill nos atletas existentes.

## Auditoria UX/UI

- Ver `UX_AUDIT.md` — 39 achados (6 🔴 / 19 🟡 / 14 🟢).
- Todos os 6 achados 🔴 resolvidos (commits 045f54e → fc3f9fb).
- Atacar o grosso na Sprint 15 (UX/UI refinement).

### Página de notificações do clube
- **Sprint sugerida:** 15
- `NotificationsPage` hoje é exclusiva de atleta: `AthleteHeader` hardcoded + `navigate` apontando para `/athlete/...`. Clube não tem página de notificações dedicada. Resolver na Sprint 15: tornar `NotificationsPage` agnóstica de header/navigate (prop ou contexto), **OU** criar rota própria do clube. Não duplicar a página.

## Sprint 9 backlog (já existente, manter aqui pra consolidar)

- Theme dark/light unificar
- Race condition 401 no mount endpoints `/athlete/profile|tournaments|stats`
- Pre-commit hook `npm ci && tsc`
- Renomear marca "Bubble"
- LGPD Settings/Conta excluir + exportar
- Feature busca de atletas
- Feed composer manual + likes + comentários
