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

### Card MATCH_RESULT no feed — informação insuficiente
- **Prioridade:** Média
- **Sprint sugerida:** 15 (UX/UI refinement) ou Sprint 9 se Feed Social v1 for prioridade
- Card atual mostra só "Vitória/Derrota 6×7 · Categoria · Torneio". Falta: parceiro do autor (pra saber com quem ele jogou), dupla adversária (contra quem), fase/rodada (Grupo X · Quartas · Final), link clicável pro perfil dos envolvidos e pro torneio. Hoje é impossível entender o contexto do jogo só pelo card.

### Navegação do atleta — acesso ao dashboard pouco descoberto
- **Prioridade:** Média
- **Sprint sugerida:** 9 ou 15
- Único caminho pra voltar do feed/perfil pro dashboard do atleta é clicar no logo da Bubble — não óbvio. Dropdown do header só tem "Feed" e "Clubes". Adicionar "Meu Dashboard" e "Meu Perfil" no dropdown (ou repensar a IA do header).

### Torneios no perfil do atleta — sem classificação final
- **Prioridade:** Baixa
- **Sprint sugerida:** 15
- Lista de torneios no perfil mostra nome/data/categoria mas não exibe a classificação final (campeão / vice / eliminado em quartas / fase de grupos). Justamente a prova social que o app deveria celebrar. Adicionar badge ou linha extra com o resultado.

## Sprint 10+ — UX polish do feed

- **Highlight visual de mentions no composer (antes de publicar):** hoje @nickname só fica verde após o post ir pro feed. Não fica destacado enquanto o usuário digita. Padrão da indústria (LinkedIn, WhatsApp) é igual, mas se houver feedback de confusão de usuário, refatorar composer/comment input pra contentEditable com overlay. Custo: ~4h. Origem: Sprint 9 A4.
- **Notificação in-app ao atleta mencionado:** quando @atleta é citado em post ou comment, gerar notificação. Bloqueado por sistema de notificações in-app pra atleta (NotificationsPage hoje só renderiza). Custo: depende do sistema. Origem: Sprint 9 A4 (D5 decidido como out-of-scope v1).

## Sprint 9 backlog (já existente, manter aqui pra consolidar)

- Theme dark/light unificar
- **Bug crítico — Super 8 não gera auto-posts no feed:** `Super8Match` não dispara `maybeCreateMatchResultPost` nem `maybeCreateTrophyPost`. Atletas que jogam Super 8 não veem os jogos no feed — quebra engajamento social do formato. Implementar `maybeCreateSuper8MatchResultPost` adaptando lógica de `maybeCreateMatchResultPost` (atenção: Super 8 tem 4 atletas únicos por partida, parceiros rotativos — gate "amigo na partida" precisa considerar todos os 4). Prioridade: Alta. Pré-lançamento.
- Race condition 401 no mount endpoints `/athlete/profile|tournaments|stats` _(reproduzido em produção 2026-06-09 — sintoma: perfil/feed exibem "Erro ao carregar" no primeiro mount; segundo acesso funciona)_
- Pre-commit hook `npm ci && tsc`
- Renomear marca "Bubble"
- LGPD Settings/Conta excluir + exportar
- Feature busca de atletas
- Feed composer manual + likes + comentários

## Scripts / Dev tooling

### seed-tournament-scores.ts — single-pass
- **Prioridade:** Baixa
- **Sprint sugerida:** sem data
- Script faz 1 passada nos brackets, propaga winners no banco mas dados locais ficam stale → quartas/semis/final não preenchem na mesma execução. Hoje requer 4 runs manuais até cascata completa (oitavas → quartas → semis → final). Fix: loop multi-pass até `matches.ready === 0` em todos os rounds, ou re-fetch dos brackets após cada save.
