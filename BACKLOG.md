# Bubble Padel — Backlog

Itens pendentes que não entraram na sprint atual. Cada item tem: prioridade, sprint sugerida, descrição.

## UX / Visual

### Hierarquia visual do card de jogo
- **Prioridade:** Média
- **Sprint sugerida:** 9
- Data completa `DD/MM/YYYY` + hora `HH:MM` ambas em azul ficam confusas. Propostas: data abreviada (`16/05`), hierarquia tipográfica diferente entre data e hora, ou cores distintas. Validar em TabGrupos, TabJogos, TabPlayoffs.

### Cinzar tabs bloqueadas em torneio ONGOING/COMPLETED
- **Prioridade:** Média
- **Sprint sugerida:** 9
- Quando torneio status = ONGOING/COMPLETED: reduzir opacity + cursor not-allowed nas tabs Estrutura, Inscrições, Categorias, Financeiro. Substituir banner por tooltip nas tabs. Manter Grupos, Jogos, Playoffs ativos.

## Validação / Backend

### Validação de gênero por categoria
- **Prioridade:** Alta
- **Sprint sugerida:** 9
- Bloquear inscrição quando gênero do atleta não bate com categoria. Masculino: só MALE. Feminino: só FEMALE. Mista: ambos. Validar backend (POST `/api/tournaments/:id/register`) e frontend (autocomplete filtrado). Pré-requisito: confirmar `Athlete.gender` no schema + backfill nos atletas existentes.

## Cleanup / Dívida técnica

### Remover código morto de seeding
- **Prioridade:** Baixa
- **Sprint sugerida:** 9 ou 10
- `generatePlayoffSeeding` em `projeto_novo/src/utils/groupUtils.ts` (linha 260) — ninguém chama. Deletar.
- `buildSeeds` local em `projeto_novo/src/components/TabPlayoffs.tsx` (linha 27) — versão duplicada, fallback raríssimo. Avaliar se deleta ou mantém.

## Auditoria UX/UI

- Ver `UX_AUDIT.md` — 39 achados (6 🔴 / 19 🟡 / 14 🟢).
- Atacar o grosso na Sprint 15 (UX/UI refinement).
- Revisar os 6 achados 🔴 antes do lançamento — alguns podem ser bloqueadores.

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
