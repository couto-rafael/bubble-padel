# PRODUCT_STRATEGY_AUDIT — Bubble Padel

**Auditor:** product-strategy specialist
**Data:** 17-jun-2026
**Escopo:** Estado estratégico pós-Sprint 9, baseline pré-Sprint 10
**Referências:** `bubble_padel_briefing.html` §4, §11, §12, §13 · `bubble_padel_backlog.html` (89 tasks/10 sprints) · `kpis_baseline_1T3.md` · `gonogo_3T3.md` · `monetizacao_2T1.md` · userMemories Sprint 9

---

## 1. Score Consolidado

**Nota geral: 5.0 / 10** (score declarado no briefing pós-Sprint 7 era 8.5 — auditoria diverge: produto avançou, *operação de produto* não)

| Dimensão | Nota | Observação |
|---|---|---|
| Definição de produto/mercado (briefing) | 9 | ✅ Claro, documentado, debates resolvidos |
| Estado técnico do produto | 8 | ✅ Sprint 9 fechou social, infraestrutura sólida |
| Alinhamento roadmap ↔ execução | 4 | ❌ Backlog HTML defasado, sprint numbering drift |
| Go/no-go: critérios definidos | 8 | ✅ Task 3.T3 entregou documento claro |
| Go/no-go: **execução** | 2 | ❌ Reunião nunca aconteceu, NPS nunca coletado |
| Métricas / instrumentação | 3 | ❌ KPIs definidos, não medidos |
| North Star metric clara | 4 | ⚠️ Candidata implícita, não acordada |
| Validação de mercado real | 2 | ❌ Zero clube externo pagante |
| Princípio "clube primeiro" mantido | 4 | ❌ Sprint 7-9 focou atleta, B2B parou |
| Sustentabilidade do founder | 6 | ⚠️ Pré-revenue OK no curto, sem trigger de ativação |

**Leitura crítica do score:** o produto está em **estado técnico de lançamento**, mas em **estado operacional pré-alpha**. Construir mais features sem rodar go/no-go é desperdício.

---

## 2. O Que Está OK ✅

### Definição de produto (briefing)
- 13 debates resolvidos com decisão registrada
- Modelo B2B2C claro, dois lados do marketplace mapeados
- Posicionamento "padel + beach tennis primeiro, multi-esporte depois" decidido
- Lançamento sem app mobile (web responsive) — decisão correta dado o time

### Estado técnico
- Sprint 9 fechou feed social v1 robusto (likes, comments, mentions, MATCH_RESULT, TROPHY)
- Algoritmo de schedule (snake-and-swap) é diferencial técnico real vs concorrentes
- Stack estável: React/TS/Tailwind/Vite + Node/Express/Prisma/Postgres/Neon/Railway
- Pre-commit hook + dev=prod database = disciplina de execução acima da média

### Critérios go/no-go (task 3.T3)
- 4 critérios binários (NPS ≥ 7, 3 torneios completos, 1 PIX real, 0 bugs críticos 2 semanas)
- Critérios desejáveis (depoimentos, uptime, termos atualizados)
- Reunião planejada, agenda definida, decisor identificado (Rafael)

### Saúde financeira
- Burn técnico R$30/mês — runway praticamente infinito pré-revenue
- Time = 1 pessoa = zero pressão de payroll

---

## 3. Gaps Identificados

### 🔴 BLOQUEADORES — antes de qualquer "lançamento"

**3.1 — Go/no-go documentado mas nunca executado**
- Task 3.T3 entregou `gonogo_3T3.md` em março/abril 2026.
- Hoje é 17-jun-2026 — passaram **2+ meses** sem reunião de go/no-go.
- Critério #1 (NPS): sem instrumento (cruza MONETIZATION 3.2).
- Critério #3 (PIX real): nenhuma evidência nas memórias de PIX processado em produção real.
- Critério #4 (0 bugs críticos 2 semanas): impossível medir sem clube real usando.
- **Resultado:** produto fica "pronto técnico" indefinidamente, sem caminho pra "pronto comercial".
- **Ação**: declarar Sprint 10 como "Sprint Go/No-Go" — meta única = ter 1-2 clubes alpha rodando torneio real, com NPS coletado, antes do dia 31-jul-2026.

**3.2 — Alpha nunca aconteceu de verdade**
- Briefing §11 diz: "Alpha (Sprint 2) → 1-2 clubes manuais → Beta (Sprint 3) → 5-10 clubes → Lançamento público".
- Realidade: Rafael testa sozinho com torneios de smoke (ex: `cmqhlztsv000lr2t4eqdug48g` "Smoke Test B1 — Sprint 9"). Sem clube externo.
- Toda Sprint 4-9 foi construída **sem validação de mercado**.
- Risco: features podem estar sendo construídas pra um clube que não existe.
- **Ação**: identificar 1-2 clubes amigos (rede pessoal, padel locais em Joinville/região) → oferecer torneio teste grátis → coletar NPS → decisão.

**3.3 — KPI baseline nunca preenchido**
- `kpis_baseline_1T3.md` entregue em março/2026 com tabela "A preencher".
- 3 meses depois, ainda em branco — não há dashboard nem query agregada.
- Sem baseline, não há como saber se Sprint 10 vai mover métrica X em Y%.
- **Ação**: criar query agregada simples (Prisma `groupBy` + count) — torneios criados, torneios completos, atletas únicos, taxa de conclusão. Hoje. Sprint 10 começa com dado.

### ⚠️ RISCO — qualidade da decisão estratégica

**3.4 — Roadmap defasado da execução real**

Backlog HTML diz Sprint 9 = "Crescimento + Marketing (Q4 2026)". Realidade entregue: feed social v1.

| Sprint backlog HTML | Sprint executada | Match? |
|---|---|---|
| Sprint 1: Legal + Emails | ✅ entregue | ✅ |
| Sprint 2: Alpha + Onboarding | ✅ entregue parcial (sem alpha real) | ⚠️ |
| Sprint 3: Beta + Pagamento | ✅ entregue parcial (sem beta real) | ⚠️ |
| Sprint 4: Lançamento Público | ✅ entregue (features) | ⚠️ (sem lançamento real) |
| Sprint 5: Gamificação | ✅ entregue | ✅ |
| Sprint 6: Design System | ✅ entregue | ✅ |
| Sprint 7: UI Redesign | ✅ entregue | ✅ |
| Sprint 8: Mobile | ⚠️ virou Sprint 8.5 ("Bugs + Strava 2 + Feed Social") | ❌ |
| Sprint 9: Crescimento + Marketing | ❌ entregue **Feed Social v1** | ❌ |
| Sprint 10: Pré-lançamento | em planejamento | — |

**Implicação**: backlog HTML não é fonte de verdade. Sprint planning vira improviso reativo.

**Ação**: regerar `bubble_padel_backlog.html` refletindo execução real, OR aposentar backlog HTML e mover roadmap pra `BACKLOG.md` markdown (mais fácil de atualizar a cada sprint).

**3.5 — Princípio "Clube primeiro" violado nas últimas 3 sprints**

Princípio do briefing: "Se o clube não consegue usar, os atletas nunca aparecem".

Sprints 7, 8.5, 9 entregaram:
- Sprint 7: UI redesign (50% clube, 50% atleta)
- Sprint 8.5: Strava Fase 2 (100% atleta)
- Sprint 9: Feed social (100% atleta)

Sprint 10 declarada inclui:
- Iniciar Torneio CLOSED→ONGOING (clube) ✅
- Edit placar Playoffs (clube) ✅
- Sets múltiplos (clube) ✅
- Banner público (clube) ✅
- Super8 auto-post (atleta)
- Race 401 (atleta)
- Validação gênero (clube + atleta)
- Highlight mention composer (atleta)
- Notificações mention (atleta)

Sprint 10 corrige a curva — mas Sprint 7-9 deixou 3 meses sem nada novo pro clube.

**Ação Sprint 11+**: se ainda não houver alpha real, congelar features de atleta e focar 100% no clube (onboarding, lembretes via WhatsApp, dashboard mais rico, gestão pós-torneio).

**3.6 — North Star Metric não acordada**
- KPIs do beta listam métricas operacionais (torneios, NPS, uptime) — todas inputs/health, nenhuma north star.
- Candidatos lógicos baseados no briefing:
  - (a) **Torneios pagos completados/mês** — combina volume (clube ativo) + monetização (PIX real)
  - (b) **Atletas únicos/mês** — engajamento de marketplace
  - (c) **Clubes ativos (≥2 torneios últimos 60d)** — proxy de retenção B2B
- Sem escolha, cada sprint persegue lógica diferente.
- **Ação**: Rafael escolhe 1. Sugestão: **(a)** alinha com monetização e go/no-go critério #3.

**3.7 — "Score 8.5" sem critério explícito de promoção**

Briefing pós-Sprint 7 declara score 8.5/10. Sem nota por dimensão, sem rubric, sem evidência.

Reverse-engineering do radar do briefing:
- Fluxo Torneio: 8.5 ✓ confirmado pela auditoria
- Mobile: 6 ✓ confirmado (Sprint 8 entregou parcial)
- Notificações: 3 ❓ (Sprint 9 tem feed mas sem push, então OK como 3-4)
- Monetização: 2 → auditoria diverge, dá 5.7 (subiu com Sprint 3)
- Legal: 2 → auditoria diverge, dá 6.2
- Marketing: 3 → ainda válido
- Onboarding Clube: 5 → ainda válido

**Implicação**: "8.5" sobrestimou. Score real provavelmente 6.5-7. Diferença não é dramática mas distorce planejamento de quando lançar.

**3.8 — "Pré-lançamento" da Sprint 10 sem definição operacional**
- Pré-lançamento de quê?
  - (a) Alpha privado com 1-2 clubes amigos? (recomendação dessa auditoria — gap 3.2)
  - (b) Beta fechado com 5-10 clubes via outreach? (briefing original)
  - (c) Cadastro self-service liberado? (lançamento público)
- Sem definição, "hardening" é exercício sem meta.
- **Ação** (cruza com Gate 0 da Sprint 10): Rafael declara em qual estado entrará ao final da Sprint 10.

### ✅ RECOMENDADO — postura de produto

**3.9 — Backlog parqueado precisa de RICE antes de Sprint 11**

Backlog não-sprint-assigned tem: OG image, PIX QR inline, club profile gate, league enhancements (oitavas/16avos, invite por email, sala de troféus, ranking por categoria), athlete social (sponsor, public profile, share button), EditTournament status guards, vários UX bugs, stats endpoint.

Cada um vai ser construído por afinidade ou pressão circunstancial. Falta RICE.

**Ação**: pré-Sprint 11, fazer planilha simples com Reach/Impact/Confidence/Effort de cada parqueado. Top 5 entram. Resto fica parqueado com data.

**3.10 — Sazonalidade não considerada no roadmap**

Padel/beach tennis no Brasil: alta dezembro-março (verão SP/SC), baixa junho-agosto.

Hoje = junho = baixa. Lançar marketing em junho/julho desperdiça.

**Recomendação**: ajustar timing — Sprint 10 (hardening) + Sprint 11 (alpha real privado) entre junho-agosto. Lançamento público em setembro/outubro coincide com entrada da primavera.

---

## 4. Diagnóstico de Fase Atual

**Onde o produto declara estar:** pré-lançamento (Sprint 10)
**Onde o produto realmente está:** pré-alpha (zero clube externo, zero PIX real, zero NPS coletado)

**Distância entre as duas leituras:** 2 fases.

| Fase | Critério mínimo | Status real |
|---|---|---|
| Pré-alpha | Produto funcional, infra ok, founder testa sozinho | ✅ Aqui |
| **Alpha** | 1-2 clubes externos, ≥1 torneio real, NPS coletado | ❌ |
| **Beta** | 5-10 clubes ativos, PIX real processado, 3 torneios completos | ❌ |
| Pré-lançamento | NPS ≥ 7, 0 bugs críticos 2 semanas, depoimentos | ❌ |
| Lançamento | Cadastro self-service + marketing ativo | ❌ |

**Implicação**: Sprint 10 deveria ser **Sprint Alpha**, não "Pré-lançamento Hardening".

---

## 5. Recomendação Estratégica para Sprint 10

### Cenário A — Manter "Pré-lançamento Hardening" (escopo atual)
- Resolver bugs críticos (Super8, race 401, sets múltiplos, validação gênero)
- Adicionar UX clube (Iniciar Torneio, edit placar, banner público)
- Continuar sem alpha real → próxima sprint pré-lançamento → repetir
- **Risco**: 6 meses sem clube real, drift continua

### Cenário B (recomendado) — Reframe para "Sprint Alpha"
**Meta única**: ter 1-2 clubes externos rodando 1 torneio real cada até 31-jul-2026.

Sub-tasks que destravam:
- 🔴 Verificar Resend (cruza LEGAL/MONETIZATION) — sem isso, clube real não recebe email
- 🔴 Coleta de NPS D+1 pós-torneio (instrumentação)
- 🔴 Super8 auto-post (gap de dados crítico)
- 🔴 Sets múltiplos persistindo (data loss inaceitável pra clube real)
- 🔴 Validação gênero (data integrity)
- 🔴 Iniciar Torneio CLOSED→ONGOING (operacional pro clube)
- ⚠️ Race 401, edit placar Playoffs, banner público (UX)
- ⚠️ Identificar e fazer outreach pra 1-2 clubes amigos (atividade não-código)

Fora do escopo Sprint 10 (Sprint 11+):
- UserType TS fix (workaround funciona)
- Notificações mention (feature nova, atleta)
- Highlight @mention composer (atleta)

### Cenário C — Híbrido pragmático
- Aceitar Sprint 10 como hardening técnico
- Em paralelo, Rafael faz outreach pra clube amigo (sem código)
- Sprint 11 = "Alpha Onboarding" focada em rodar o primeiro torneio real

---

## 6. Recomendações Priorizadas

| # | Ação | Prioridade | Esforço | Onde encaixa |
|---|---|---|---|---|
| 1 | Decidir fase real do produto (pré-alpha → alpha) | 🔴 | 30min decisão | Pré-Sprint 10 |
| 2 | Identificar 2 clubes amigos para alpha | 🔴 | 2-8h outreach | Sprint 10 paralelo |
| 3 | Coletar baseline KPI hoje (query agregada) | 🔴 | 2h | Sprint 10 |
| 4 | Definir e comunicar North Star Metric | 🔴 | 1h decisão | Sprint 10 |
| 5 | Reframe Sprint 10 = Sprint Alpha (Cenário B) | 🔴 | 1h replanning | Hoje |
| 6 | Regenerar BACKLOG.md como fonte de verdade ativa | ⚠️ | 3h | Sprint 10 |
| 7 | Aposentar `bubble_padel_backlog.html` ou atualizar | ⚠️ | 4h | Sprint 11 |
| 8 | RICE dos parqueados antes de Sprint 11 | ⚠️ | 2h | Pré-Sprint 11 |
| 9 | Ajustar timing de lançamento público a setembro (sazonalidade) | ✅ | 0h decisão | Já |

---

## 7. Itens Sugeridos para BACKLOG.md

```
## Product Strategy

- [P0] Decidir fase real do produto: pré-alpha vs alpha vs beta (decisão Rafael)
- [P0] Identificar 2 clubes amigos para alpha real (outreach manual)
- [P0] Criar query agregada de baseline KPIs (torneios criados/completos, atletas únicos, taxa de conclusão) — backend script + endpoint admin
- [P0] Definir North Star Metric oficial (sugestão: torneios pagos completados/mês)
- [P0] Coleta de NPS D+1 (cruza MONETIZATION P0)
- [P1] Reframe Sprint 10 como "Sprint Alpha" — meta única = 1-2 clubes externos rodando torneio real
- [P1] Regenerar BACKLOG.md como fonte de verdade primária (aposentar bubble_padel_backlog.html ou atualizar)
- [P2] RICE de todos os parqueados antes de Sprint 11 planning
- [P2] Cadência mensal de revisão de trigger de go/no-go (cruza MONETIZATION)
- [P3] Timing de lançamento público = início primavera (setembro/outubro) por sazonalidade
```

---

## 8. Trigger para Próxima Revisão Estratégica

Refazer auditoria quando:
- Após alpha real rodar (1 torneio externo completo) — recalcular score com dados reais
- Antes de qualquer decisão de pivô (mudar foco de clube vs atleta)
- Antes do go/no-go formal pra lançamento público
- Se 8 semanas passarem sem mover métrica north star
