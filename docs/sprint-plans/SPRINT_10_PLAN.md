# SPRINT 10 PLAN — Sprint Alpha

**Tema:** Alpha real — 1 clube externo cadastrado + 1 torneio criado
**Janela:** Open-ended (fecha quando 13 tasks código + 4 operacionais concluem)
**North Star Metric:** Torneios pagos completados/mês
**Decisões base:** ALPHA scope · sem domínio · sem split spike · DPAs versão light

---

## 1. Definition of Done

A sprint só fecha quando **todos** abaixo forem verdade:

- [ ] 13 tasks de código mergeadas em `master` com pre-commit `tsc --noEmit` passando
- [ ] 4 itens operacionais executados (N1-N4)
- [ ] 1 clube amigo cadastrado e logado na plataforma
- [ ] 1 torneio criado pelo clube amigo (não precisa rodar — Sprint 11 roda)
- [ ] 0 bugs P0 abertos no Sentry últimas 72h
- [ ] BACKLOG.md atualizado com itens novos descobertos durante a sprint

---

## 2. Ordem de Execução

Ordem minimiza conflito de schema/merge e libera dependências cedo:

```
T01 Sets múltiplos          ─┐
T02 Validação gênero         │  Bugs de dados (schema-heavy primeiro)
T06 Super8 auto-post         │
T03 Race 401                 ├─ Bugs UX em paralelo
T04 Iniciar Torneio          ┐
T05 Edit placar Playoffs     │  UX clube (depende T01 estabilizar)
T07 PIX QR inline            │
T08 4 emails PIX             ├─ Pagamento
T09 Email D+1 NPS            │
T10 Home FAQ + cards         │
T11 Política Feed Social     ├─ Comunicação/marca
T12 Query baseline KPIs      │
T13 Card Total arrecadado    ┘
```

Operacional (em paralelo, não bloqueia código):
- N1 Resend workaround → fazer imediato
- N2 DPAs leitura → quando Rafael tiver 2h
- N3 Outreach 2 clubes → Rafael decide quando
- N4 Comunicar NSM → imediato

---

## 3. Tasks de Código (13)

### S10-T01 — Sets múltiplos persistindo
**Por quê:** UI permite registrar múltiplos sets, schema só armazena 1. Data loss silenciosa.
**Esforço:** 8h
**Arquivos:**
- `backend/prisma/schema.prisma` — adicionar `sets Json?` em `Match` e `Super8Match` (formato `[{set:1,score1:6,score2:3},{set:2,score1:4,score2:6},...]`)
- `backend/src/services/MatchService.ts` — gravar/ler array de sets
- `backend/src/routes/matches.ts` — payload aceita array
- `projeto_novo/src/components/ScoreModal.tsx` — enviar array
- `projeto_novo/src/types/match.ts` — tipo `MatchSets`
**Critérios de aceite:**
- [ ] Salvar 3 sets em uma partida e refresh página: 3 sets aparecem
- [ ] Partidas antigas (1 set apenas) renderizam sem quebrar (fallback)
- [ ] `score1`/`score2` legacy continuam preenchidos com último set (back-compat)
- [ ] `npx prisma db push` sem warning de data loss
**Migration:** aditiva (`sets Json?` nullable). Sem deploy especial.
**Commit:** `feat(match): persistir múltiplos sets (schema + service + UI)`

---

### S10-T02 — Validação de gênero por categoria
**Por quê:** Dupla masculina aceita em categoria feminina hoje. Data integrity.
**Esforço:** 3h
**Arquivos:**
- `backend/src/services/TeamService.ts` — validar `player1.gender` + `player2.gender` vs `category.gender`
- `backend/src/routes/teams.ts` — Zod schema rejeita combinação inválida
- `projeto_novo/src/components/TournamentRegistration.tsx` — bloquear inscrição no client com mensagem clara
**Critérios de aceite:**
- [ ] Tentar inscrever dupla M+M em categoria Feminino → erro 400 com mensagem clara
- [ ] Dupla mista em Mista → aceito
- [ ] Dupla M+M em Open → aceito
- [ ] Dupla F+F em Feminino → aceito
**Commit:** `fix(teams): validar gênero da dupla vs categoria do torneio`

---

### S10-T03 — Race 401 mount em /athlete/*
**Por quê:** UX bug, atleta logado é deslogado ao navegar pra /athlete/tournaments.
**Esforço:** 4h (investigação + fix)
**Arquivos a investigar:**
- `projeto_novo/src/hooks/useAuth.ts` — sequência de `getCurrentUser()`
- `projeto_novo/src/services/api.ts` ou `AuthService.ts` — interceptor 401
- `projeto_novo/src/components/RouteGuard.tsx` (ou equivalente) — race entre `loading` e fetch
**Critérios de aceite:**
- [ ] Atleta logado navega entre `/athlete/dashboard`, `/athlete/tournaments`, `/athlete/leagues` sem auto-logout
- [ ] Atleta com token expirado vê redirect graceful pra `/login` (sem flash 401)
- [ ] 0 requests com 401 quando token válido no localStorage
**Commit:** `fix(auth): eliminar race 401 no mount de rotas /athlete/*`

---

### S10-T04 — Botão "Iniciar Torneio" CLOSED→ONGOING
**Por quê:** Hoje status só vira ONGOING ao salvar 1º placar. Clube precisa de gesto explícito.
**Esforço:** 3h
**Arquivos:**
- `backend/src/routes/tournaments.ts` — endpoint `POST /api/tournaments/:id/start` (CLOSED → ONGOING, autorização clube dono)
- `backend/src/services/TournamentService.ts` — método `startTournament(tournamentId, clubId)`
- `projeto_novo/src/pages/EditTournament.tsx` ou `MyTournaments.tsx` — botão visível só quando status=CLOSED
- `projeto_novo/src/services/api.ts` — `TournamentService.start(id)`
**Critérios de aceite:**
- [ ] Clube com torneio CLOSED vê botão "Iniciar Torneio"
- [ ] Click → status muda pra ONGOING, botão some, aba "Jogos" habilita
- [ ] Outro clube não consegue iniciar (403)
- [ ] Torneio ONGOING/COMPLETED/DRAFT não mostra botão
**Commit:** `feat(tournament): botão Iniciar Torneio (CLOSED → ONGOING)`

---

### S10-T05 — Edit placar reaberto na aba Playoffs
**Por quê:** Aba Jogos permite editar placar reaberto, aba Playoffs não.
**Esforço:** 3h
**Arquivos:**
- `projeto_novo/src/components/PlayoffBracket.tsx` (ou onde está) — paridade com aba Jogos
- `projeto_novo/src/components/ScoreModal.tsx` — confirmar que abre com dados pré-preenchidos
- backend: validar que `PlayoffService.updateMatch` permite reabrir/editar resultado
**Critérios de aceite:**
- [ ] Match playoff já com placar salvo → click abre ScoreModal com valores
- [ ] Edição salva e propaga (ranking + posts atualizam se aplicável)
- [ ] Comportamento idêntico à aba Jogos
**Commit:** `fix(playoffs): permitir edição de placar já registrado`

---

### S10-T06 — Super8 auto-post (TROPHY + MATCH_RESULT)
**Por quê:** Torneios Super 8 finalizam sem gerar TROPHY nem MATCH_RESULT — silêncio total no feed.
**Esforço:** 6h
**Arquivos:**
- `backend/src/services/PostService.ts` — novo método `maybeCreateSuper8MatchResultPost` (lê `Super8Match` em vez de `Match`)
- `backend/src/services/GamificationService.ts` — `awardTrophies()` detecta torneio Super 8 e mapeia colocação por pontos individuais
- `backend/src/services/Super8Service.ts` — após salvar placar de Super8Match, chama PostService
- `backend/prisma/schema.prisma` — confirmar campos suficientes em Super8Match (jogador, pontos individuais)
**Critérios de aceite:**
- [ ] Torneio Super 8 finalizado → 1 TROPHY pro 1º colocado, 1 pro 2º
- [ ] Cada partida individual gera MATCH_RESULT pra cada jogador (4 posts por partida, idempotente)
- [ ] Metadata enriquecida (parceiro N/A em Super 8, opponents = 3 outros jogadores)
- [ ] Privacy gate `settings.matches=PRIVATE` respeitado
- [ ] Dedup por `matchId` (sufixo `super8:` para não colidir com regular)
**Commit:** `feat(feed): Super8Match gera auto-posts (TROPHY + MATCH_RESULT)`

---

### S10-T07 — PIX QR Code inline no PaymentModal
**Por quê:** Hoje abre em nova aba. Atrito de checkout direto na conversão.
**Esforço:** 4h
**Arquivos:**
- `projeto_novo/package.json` — `qrcode.react`
- `projeto_novo/src/components/PaymentModal.tsx` — renderizar QR inline a partir do `pixCode` retornado pela AbacatePay
- Manter botão "Copiar código PIX" + countdown de expiração
**Critérios de aceite:**
- [ ] Modal abre com QR visível sem nova aba
- [ ] Botão "Copiar código" copia o `pixCode` original
- [ ] Countdown mostra expiração
- [ ] Após `webhook` confirmar pagamento, modal fecha automático com confirmação
**Commit:** `feat(payment): PIX QR inline com qrcode.react`

---

### S10-T08 — 4 templates de email PIX
**Por quê:** Atleta paga e recebe silêncio. Quebra brutal de tom da marca.
**Esforço:** 4h (1h cada)
**Arquivos:**
- `backend/src/services/EmailService.ts` — 4 novos métodos:
  - `sendPixGerado({ to, athleteName, tournament, valor, pixCode, expiresAt })`
  - `sendPagamentoConfirmado({ to, athleteName, tournament, valor })`
  - `sendPixExpirado({ to, athleteName, tournament, valor, regenerateLink })`
  - `sendReembolsoProcessado({ to, athleteName, tournament, valor })`
- `backend/src/services/PaymentService.ts` — chamar `sendPixGerado` ao criar charge
- `backend/src/services/PaymentService.ts` — chamar `sendPagamentoConfirmado` no webhook
- `backend/src/services/PaymentService.ts` — chamar `sendPixExpirado` no expirar
- Reembolso: trigger manual (clube processa fora) — gatilho via endpoint admin

**Copy:** Claude (copy-specialist) entrega templates em sessão separada antes da implementação.

**Critérios de aceite:**
- [ ] Inscrição paga via PIX → email "Pagamento Confirmado" chega
- [ ] Inscrição com PIX gerado mas não pago → email "PIX Gerado" chega imediato
- [ ] PIX expira → email "PIX Expirado" com link pra regenerar
- [ ] Todos seguem template visual já estabelecido (header dark + corpo + CTA cyan + footer)
**Commit:** `feat(emails): adicionar 4 templates de pagamento PIX (gerado, confirmado, expirado, reembolso)`

---

### S10-T09 — Email D+1 NPS pós-torneio
**Por quê:** Critério #1 do go/no-go (NPS ≥ 7) sem instrumento. Sem isso, lançamento fica indefinido.
**Esforço:** 6h
**Arquivos:**
- Criar form Tally/Forms (Rafael, ~15min) — 3 perguntas: NPS 0-10, "o que melhor funcionou", "o que faltou"
- `backend/src/services/EmailService.ts` — `sendNpsRequestClube` e `sendNpsRequestAtleta`
- `backend/src/cron/dailyNpsJob.ts` (ou similar) — cron diário, busca torneios COMPLETED há exatamente 1 dia
- `backend/prisma/schema.prisma` — adicionar `npsRequestSentAt DateTime?` em `Tournament` (evitar duplo envio)
- Cron registrado em `backend/src/index.ts` ou bull queue
**Critérios de aceite:**
- [ ] Torneio COMPLETED há 1 dia → email automático sai pro clube e pra cada atleta participante
- [ ] Email tem link pro form Tally com `?tournament=X&user=Y` no query
- [ ] Cron idempotente (`npsRequestSentAt` previne reenvio)
- [ ] Smoke test manual: criar torneio fake COMPLETED ontem, rodar cron, verificar envio
**Commit:** `feat(nps): coleta automática D+1 pós-torneio via email + Tally`

---

### S10-T10 — Corrigir Home.tsx FAQ + cards de feature
**Por quê:** "Mercado Pago/PagSeguro" no FAQ (gateway errado) + "App Mobile Completo" (promete o que não tem). Risco CDC.
**Esforço:** 1h
**Arquivos:**
- `projeto_novo/src/pages/Home.tsx` — 3 edits:
  - FAQ: substituir "Mercado Pago, PagSeguro, etc" por "gateway PIX parceiro (~1% por transação)"
  - Card "App Mobile Completo" → "Funciona Direto no Celular" + descrição "Acesso pelo navegador em qualquer dispositivo — sem instalar nada"
  - Card "Gestão Automática" → "Chaves Geradas em 1 Clique / A gente gera grupos e mata-mata na hora. Sem planilha."
**Critérios de aceite:**
- [ ] Build sem warning
- [ ] Mobile responsive mantido
- [ ] Nenhuma menção a "Mercado Pago" ou "PagSeguro" em Home.tsx
- [ ] Nenhuma menção a "App Mobile" como se fosse nativo
**Commit:** `fix(home): corrigir FAQ gateway + cards de feature (publicidade enganosa)`

---

### S10-T11 — Seção "Feed Social" na Política de Privacidade
**Por quê:** Sprint 9 introduziu @mentions e auto-posts sem cobertura legal explícita.
**Esforço:** 2h
**Arquivos:**
- `projeto_novo/src/pages/TermsPage.tsx` (ou `docs/termos_legais_1T1.md`) — adicionar seção
- Conteúdo:
  - "Feed Social — Exposição de Dados"
  - O que é exposto (nome, nickname, resultado de torneio, colocação)
  - Quem vê (qualquer atleta da plataforma — Fase Beta: amigos; Fase Pública: todos)
  - Base legal (legítimo interesse — relação social esportiva)
  - Opt-out via `settings.matches = PRIVATE` (mostrar caminho exato no app)
  - Direito de remoção: post deletável pelo autor, dado original (placar) é fato esportivo público
- Versionamento: bump `termsVersion` no schema → próximo login do usuário pede re-aceite
**Critérios de aceite:**
- [ ] Política em `/privacidade` ou `/termos` (aba Privacidade) contém nova seção
- [ ] `termsVersion` incrementado
- [ ] Usuário com versão antiga vê modal de re-aceite no próximo login
**Commit:** `feat(legal): seção Feed Social na Política de Privacidade + bump termsVersion`

---

### S10-T12 — Query baseline KPIs
**Por quê:** KPI baseline `kpis_baseline_1T3.md` em branco há 3 meses. Sprint 11+ precisa começar com dado.
**Esforço:** 4h
**Arquivos:**
- `backend/src/scripts/kpiSnapshot.ts` — script CLI agregado:
  - Total torneios criados (count)
  - Total torneios COMPLETED (count)
  - Taxa de conclusão (%)
  - Atletas únicos (count distinct)
  - Clubes únicos com ≥1 torneio (count distinct)
  - Posts MATCH_RESULT + TROPHY gerados (count)
- Output: console + opcionalmente JSON em `docs/kpis_snapshot_YYYY-MM-DD.json`
- `package.json` — script `npm run kpi:snapshot`
**Critérios de aceite:**
- [ ] `npm run kpi:snapshot` retorna número pra todos os campos
- [ ] Output em JSON salvo em `docs/kpis_snapshot_2026-MM-DD.json`
- [ ] Documentado em `docs/kpis_baseline_1T3.md` que esses números são a baseline ponto-em-tempo
**Commit:** `feat(kpi): script de baseline snapshot (Prisma agregado)`

---

### S10-T13 — Card "Total arrecadado via Bubble" no ClubDashboard
**Por quê:** Clube vê valor por torneio, não agregado. Sem agregado, ROI invisível, dificulta ativação futura.
**Esforço:** 3h
**Arquivos:**
- `backend/src/routes/clubs.ts` — endpoint `GET /api/clubs/me/financial-summary` retorna `{ totalArrecadado, totalRepasse, totalComissao, qtyTorneios }` agregando Reconciliation COMPLETED do clube
- `projeto_novo/src/components/club/FinancialSummaryCard.tsx` — novo componente
- `projeto_novo/src/pages/ClubDashboard.tsx` — incluir card no header
**Critérios de aceite:**
- [ ] Card visível no topo do dashboard mostrando total arrecadado lifetime
- [ ] Clube novo (sem torneio) → card mostra R$0 sem quebrar
- [ ] Valor bate com a soma manual dos Reconciliations COMPLETED no banco
**Commit:** `feat(club-dashboard): card total arrecadado via Bubble (lifetime)`

---

## 4. Tasks Operacionais (4)

### N1 — Workaround Resend (verificar email do clube alpha)
**Esforço:** 30min por clube alpha
**Procedimento:**
1. Rafael recebe email do clube amigo
2. Acessa Resend Dashboard → adiciona email como "Verified Recipients"
3. Clube precisa confirmar via link enviado por Resend
4. Após confirmação, emails da Bubble chegam normalmente

**Limitação:** funciona pra 1-2 clubes. Pra Beta precisa do domínio.

---

### N2 — DPAs leitura + arquivo (versão light)
**Esforço:** 2h
**Procedimento:**
1. Ler termos de Resend: https://resend.com/legal/dpa
2. Ler termos de AbacatePay: política de privacidade no site
3. Ler termos de Cloudinary: https://cloudinary.com/privacy
4. Salvar 3 PDFs em pasta Drive: `Bubble Padel/Legal/DPAs/`
5. Documento `docs/dpa_evidence.md` listando: data de leitura, link, e versão do termo

**Critério de aceite:** 3 PDFs em Drive + `dpa_evidence.md` commitado.

---

### N3 — Outreach pra 2 clubes amigos
**Esforço:** 2-8h Rafael solo
**Procedimento sugerido:**
1. Listar 5 clubes candidatos (rede pessoal Joinville/região)
2. Contato direto: WhatsApp pessoal "Tô lançando uma plataforma de gestão de torneios. Posso te mostrar 15 minutos?"
3. Demo presencial ou via call
4. Cadastrar o clube no app (Rafael auxilia primeiro torneio)
5. Acompanhar setup

**Critério de aceite:** 1 clube cadastrado e logado + 1 torneio criado no app.

---

### N4 — Comunicação interna de North Star Metric
**Esforço:** 30min
**Procedimento:**
1. Atualizar `CLAUDE.md` raiz: adicionar seção "North Star Metric: Torneios pagos completados/mês"
2. Atualizar `bubble_padel_briefing.html` (ou criar `docs/north_star.md` se preferir não mexer no HTML defasado)
3. Adicionar query ao `kpiSnapshot.ts` (T12) que calcula NSM mensal

---

## 5. Estimativa Total

| Categoria | Esforço |
|---|---|
| Código (13 tasks) | ~51h |
| Operacional (4 itens) | ~5-11h |
| **Total** | **~56-62h** |

Open-ended. Cadência sugerida: 10-15h/semana → fecha em 4-6 semanas.

---

## 6. Riscos & Mitigações

| Risco | Mitigação |
|---|---|
| Schema change em T01 conflita com T06 | Fazer T01 inteiro antes de começar T06 |
| Cron de NPS (T09) duplica envio | Idempotência via `npsRequestSentAt` no schema |
| Outreach (N3) não destrava clube | Sprint segue mesmo assim; reframe pra Beta de N3 fica pra Sprint 11 |
| Resend workaround quebra no 3º clube | Aceitar e parar de aceitar clubes até registrar domínio (forçar decisão Beta) |
| Form Tally cai/é descontinuado | Migrar pra Google Forms (mesma estrutura) |

---

## 7. O Que Fica Fora (Sprint 11+)

- UserType TS fix (cosmético, workaround `as string` funciona)
- Banner "CAMPEÕES" no perfil público (não bloqueia alpha)
- Highlight @mention no composer (polish, não bloqueia)
- Notificações de mention (feature nova, não bloqueia)
- "Última Caminhada" no AthleteProfile
- Oitavas/16avos pontos de liga
- 3 badges de clube (B2B gamification)
- Public athlete profile `/athletes/:id`
- OG image dinâmica
- Mobile responsiveness audit completo
- Sprint Sentry + UptimeRobot ativos

---

## 8. Próximos Gates

- **Gate 2 (checklist por task):** ativado quando Rafael for executar uma task específica. Não fazer Gate 2 pra todas as 13 agora — só pra a próxima a ser executada.
- **Gate 3 (entrega):** ao final de cada task — Rafael valida critérios de aceite e marca [x] na lista.
- **Sprint Boundary Audit:** ao fim da sprint, rodar review-pipeline gates 3-7 sobre as 13 tasks.

---

## Regra permanente — Gate 3 requer hash

Todo Gate 3 (aprovação de task) exige hash de commit no relato do Code.

Formato mínimo do relato:
"T## concluída. Commit {hash}. Critérios de aceite: [...]"

Sem hash reportado: task fica em "APROVADO PENDENTE COMMIT" até o hash aparecer. Zero exceção.

**Motivação:** sessão pós-Sprint 9 descobriu que T01 (sets múltiplos) estava em working tree há sessões sem commit, apesar de ter sido "aprovada". Reset acidental teria evaporado a entrega.

---

## 9. Primeira Task Sugerida

**S10-T01 — Sets múltiplos persistindo.** Mais bloqueante (schema change, afeta T05/T06). Comece por aqui.

Quando estiver pronto pra executar T01, abra Gate 2 no chat: "Gate 2 T01" → eu entrego prompt enxuto pro Code com regras + endpoints + arquivos + commit (sem código completo).
