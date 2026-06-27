# MONETIZATION_AUDIT — Bubble Padel

**Auditor:** monetization specialist
**Data:** 17-jun-2026
**Escopo:** Estado de monetização pós-Sprint 9, baseline pré-Sprint 10
**Referências:** `bubble_padel_briefing.html` §8, §12, §13 (debate #1) · `monetizacao_2T1.md` · `compliance_pagamento_3T1.md` · `PaymentService.ts` · `CLAUDE.md` · userMemories

---

## 1. Score Consolidado

**Nota geral: 5.7 / 10** (subiu de 2 do briefing — Sprint 3 entregou infra, mas ativação travada)

| Dimensão | Nota | Tendência |
|---|---|---|
| Modelo de receita (decisão) | 9 | ✅ Claro, documentado, comunicado |
| Infraestrutura técnica (split, reconcile) | 6 | ⚠️ Reconciliation pronto, split AbacatePay pendente |
| Trigger operacional de ativação | 4 | ❌ Critérios existem, processo de coleta não |
| Unit economics modelado | 3 | ❌ Sem dados reais, sem cálculo de CAC/LTV |
| Comunicação ao clube (transparência) | 5 | ⚠️ Copy boa, FAQ inconsistente |
| Diversificação Fase 3 | 5 | → Descrita no briefing, sem plano executável |
| Sustentabilidade atual (cash) | 7 | ✅ Custo R$30/mês, zero receita = OK pré-revenue |
| Coleta de NPS (input pra ativação) | 2 | ❌ Critério #2 do go/no-go não tem instrumento |

---

## 2. O Que Está OK ✅

### Modelo decidido (task 2.T1)
- Modelo B: comissão por atleta inscrito (R$3,00 alvo, configurável via `COMMISSION_PER_ATHLETE`)
- Mecanismo previsto: split via AbacatePay (quando lançar feature)
- Posicionamento: "Grátis durante o lançamento" (não "para sempre" — preserva flexibilidade legal)
- Termos de Uso já contemplam: "A Bubble se reserva o direito de introduzir cobrança com notificação de 30 dias"

### Infraestrutura técnica (Sprint 3)
- `Reconciliation` model registra bruto, comissão, repasse — pronto pra ativar com R$3 sem mudança de schema
- `PaymentService.ts` integrado AbacatePay (sandbox key documentada, DEV_MODE fallback)
- Webhook de confirmação processado, status PENDING/PAID/EXPIRED/CANCELLED/REFUNDED
- Email de relatório financeiro ao clube no fim do torneio (`sendRelatorioRepasse`)
- Cobrança por jogador (player1 + player2) — modela inscrição em dupla corretamente

### Custos operacionais sob controle
- Railway Hobby: $5/mês
- Neon free tier (suficiente até ~10 clubes simultâneos)
- Resend free tier
- Cloudinary free tier
- AbacatePay: sem mensalidade, ~1% por transação (paga pelo clube)
- **Burn técnico estimado: R$30/mês** — sustenta pré-revenue por anos

---

## 3. Gaps Identificados

### 🔴 BLOQUEADORES — antes de ativar cobrança

**3.1 — Split AbacatePay não implementado pela AbacatePay**
- Cenário hoje: PIX vai 100% pro clube. Sem split, Bubble não recebe automaticamente.
- Implicação: ativar `COMMISSION_PER_ATHLETE = 3` cria obrigação do clube pagar Bubble depois (boleto manual ou TED).
- Ninguém quer cobrar boleto de R$60 (20 atletas × R$3) de cada clube manualmente. Vai gerar inadimplência e atrito.
- **Decisão necessária**: (a) esperar AbacatePay liberar split, (b) migrar pra Asaas (suporta split desde sempre, taxa 0.99%), (c) cobrar mensalidade flat enquanto não há split.
- **Recomendação**: avaliar prazo da AbacatePay liberar split. Se >3 meses, migrar pra Asaas antes de Fase 2.

**3.2 — Critério #2 do go/no-go (NPS ≥ 8) sem instrumento de coleta**
- Backlog task 1.T3 menciona "Formulário pós-torneio" — não há link no app, não há email automático com survey.
- Sem instrumento, critério não é mensurável → ativação de cobrança fica indefinida.
- **Ação**: Sprint 10 ou 11 — email D+1 pós-torneio com link pra formulário NPS (Tally/Typeform/Forms), 3 perguntas máx. Trigger: status torneio = COMPLETED.

**3.3 — Verificação Resend pendente bloqueia ciclo financeiro**
- Memórias: "Resend emails only reach verified address until domain verified".
- Implicação direta de monetização: clube real cadastrado **não recebe `sendRelatorioRepasse`** → não vê quanto arrecadou → não tem incentivo a usar de novo.
- Sem retenção, não há base pra ativar cobrança.
- **Ação**: registrar bubblepadel.com + verificar Resend (cruza com LEGAL_AUDIT item 1).

### ⚠️ RISCO — qualidade da decisão de pricing

**3.4 — Unit economics nunca calculado com dados reais**

Cálculo declarado no briefing/skill:
- Custo por torneio: ~R$20 (Railway + Resend + suporte)
- Média: 20 atletas/torneio
- Break-even: R$1/atleta
- Margem 60%: R$2.50 → R$3

Problemas:
- "20 atletas/torneio" é estimativa sem base. Torneios reais do `cmqhlztsv000lr2t4eqdug48g` mostram 15 grupos = ~60 atletas. Outros não documentados.
- "Custo por torneio R$20" inclui suporte humano? Rafael é 1 pessoa — custo de oportunidade não está modelado.
- "Margem 60%" é arbitrário — não vem de target de runway nem de funding round.

**Ação**: depois do primeiro torneio pago real, modelar com dados:
- Custo real por torneio (storage, emails enviados, tempo de suporte em min)
- Distribuição real de atletas/torneio (P50, P90)
- Sensibilidade da margem (testar R$2 / R$3 / R$5 com 3 clubes diferentes antes de fixar)

**3.5 — PIX QR Code abre em nova aba (parked Sprint 4)**
- Atrito conhecido no checkout: atleta sai do contexto pra pagar.
- Impacto direto em conversão de inscrição = impacto direto em volume de comissão futura.
- **Ação**: implementar `qrcode.react` inline no PaymentModal. Esforço 4h. Pré-requisito pra otimizar funil antes de ativar cobrança.

**3.6 — Copy inconsistente entre site e realidade (cruza com LEGAL 3.6)**
- `Home.tsx` FAQ: "Se você cobrar inscrição dos jogadores, haverá a taxa padrão do gateway de pagamento (Mercado Pago, PagSeguro, etc)"
- Realidade: AbacatePay, taxa ~1% (vs Mercado Pago 0.99% PIX, PagSeguro 0.99% PIX — paridade, mas nomeação errada).
- **Pior**: clube lê "Mercado Pago / PagSeguro" e pode esperar maquininha física, conta multi-canal, suporte robusto. AbacatePay é fintech menor — expectativa quebrada na primeira ligação de suporte.
- **Ação**: corrigir copy. Sugestão: "Você paga apenas a taxa do gateway PIX (~1% por transação)".

**3.7 — Dashboard financeiro do clube é por-torneio, não agregado**
- Briefing diz "Dashboard financeiro funcionando" — confirmado: relatório por torneio.
- Falta: "Quanto eu (clube) já arrecadei na Bubble até hoje?" — número agregado.
- Sem agregado, clube não sente o ROI da plataforma → ativar cobrança fica mais difícil de justificar.
- **Ação**: adicionar card "Total arrecadado via Bubble" no `ClubDashboard` somando todos os Reconciliations COMPLETED do clube. Esforço 3h.

### ✅ RECOMENDADO — postura estratégica

**3.8 — Sazonalidade não modelada**
- Padel/beach tennis no Brasil: alta dezembro-março (verão), baixa junho-agosto (inverno em parte do país).
- Se a cobrança ativar em pleno verão, métricas explodem; ativar em inverno, parecem decepcionantes.
- **Recomendação**: ativar cobrança em **início de primavera** (setembro/outubro) — clube ganha 3 meses de receita crescente antes de avaliar churn.

**3.9 — Plano de migração AbacatePay → Asaas indefinido**
- Briefing/monetizacao_2T1 dizem "Migrar para Asaas quando introduzir comissão".
- Sem plano técnico: o que muda em `PaymentService.ts`? Webhooks compatíveis? Histórico de pagamentos migra?
- **Ação**: criar `docs/migration_payment_gateway.md` antes de Sprint de ativação. 3h de spike.

**3.10 — Fase 3 (marketplace, professor, plano PRO) sem owner**
- Briefing lista futuro: marketplace de equipamentos, agendamento de aulas, plano PRO.
- Cada um é negócio próprio, com modelo próprio. Hoje é apenas lista.
- **Recomendação**: pré-Sprint 15, fazer RICE de cada uma vs alternativas. Não é problema agora — é problema se vier a ser construído por inércia.

---

## 4. Trigger de Ativação Operacional — Proposta

Critério do briefing/skill é checklist de **estado**. Falta processo de **decisão**.

### Proposta de cadência

**Mensalmente** (primeira segunda do mês), Rafael revisa o painel:

| Métrica | Meta | Como medir |
|---|---|---|
| Clubes ativos (2+ torneios últimos 60 dias) | ≥ 5 → considerar ativar; ≥ 50 → ativar | Query Prisma agregada |
| NPS médio (3+ respostas) | ≥ 7 P0 / ≥ 8 ideal | Tally/Forms link D+1 pós-torneio |
| Torneios completos sem bug crítico | ≥ 3 cumulativo | Sentry zero P0 últimas 2 semanas |
| PIX real processados | ≥ 1 (Fase 1 → Fase 2 trigger) | `Payment.status = PAID` em prod |
| Cash runway (Rafael) | > 6 meses | Externo ao produto, decisão dele |

### Decisão binária

- **Todos ≥ meta** → enviar email 30 dias antes de ativar comissão
- **Algum < meta** → parquear 30 dias, revisar próximo mês
- **Cash runway < 3 meses** → considerar ativar antes (com aviso de 30d) mesmo com NPS abaixo

---

## 5. Unit Economics — Modelo Provisório

**Cenário base (10 clubes ativos, ano 1):**

| Item | Valor |
|---|---|
| Clubes pagantes | 10 |
| Torneios/clube/mês | 2 |
| Atletas/torneio | 25 (estimativa otimizada — verão pode ser 40, inverno 15) |
| **Volume mensal** | 10 × 2 × 25 = **500 inscrições** |
| Comissão por atleta | R$3 |
| **Receita bruta/mês** | **R$1.500** |
| Custos infra (Railway + Neon + Resend) | R$30 |
| Custos AbacatePay (1% × inscrições) | depende do ticket — se R$120/inscrição, R$600 (pago pelo clube, não Bubble) |
| **Receita líquida Bubble/mês** | ~**R$1.470** |

**Cenário escala (50 clubes, ano 2):**
- 50 × 2 × 25 = 2.500 inscrições/mês
- R$7.500/mês receita bruta
- ~R$7.400 líquido
- Suficiente pra Rafael full-time + 1 contratação

**Cenário pessimista (sazonalidade inverno, 10 clubes):**
- 10 × 1 × 15 = 150 inscrições/mês
- R$450/mês — abaixo de subsistência

**Implicação:** o produto **só sustenta full-time o founder com 30+ clubes ativos consistentes**. Antes disso, é projeto paralelo + investimento próprio.

---

## 6. Recomendações Priorizadas

| # | Ação | Prioridade | Esforço | Bloqueia ativação? |
|---|---|---|---|---|
| 1 | Verificar Resend (cruza LEGAL 1) | 🔴 | 4h | Sim |
| 2 | Implementar coleta de NPS D+1 pós-torneio | 🔴 | 4h | Sim |
| 3 | Decisão AbacatePay split vs migração Asaas | 🔴 | 8h spike | Sim |
| 4 | Corrigir copy Home.tsx (Mercado Pago → AbacatePay) | ⚠️ | 30min | Não, mas urgente |
| 5 | PIX QR inline no PaymentModal | ⚠️ | 4h | Não, mas reduz atrito |
| 6 | "Total arrecadado via Bubble" agregado no ClubDashboard | ⚠️ | 3h | Não |
| 7 | Documento migration_payment_gateway.md | ✅ | 3h | Não |
| 8 | Definir cadência mensal de revisão de trigger | ✅ | 1h | Não |
| 9 | Modelar sazonalidade no plano de ativação | ✅ | 2h | Não |

**Total pra destravar ativação de cobrança (1-3): ~16h**

---

## 7. Itens Sugeridos para BACKLOG.md

```
## Monetization / Pricing

- [P0] Coleta de NPS D+1 pós-torneio (Tally/Typeform link em email automático)
- [P0] Decisão técnica: aguardar split AbacatePay vs migração Asaas (spike 8h)
- [P0] Verificar Resend / domínio bubblepadel.com (cruza LEGAL_AUDIT P0)
- [P1] Corrigir copy Home.tsx FAQ: substituir Mercado Pago/PagSeguro por AbacatePay ou genérico
- [P1] PIX QR Code inline no PaymentModal (qrcode.react) — substituir nova aba
- [P1] Card "Total arrecadado via Bubble" agregado no ClubDashboard (soma Reconciliation COMPLETED)
- [P2] docs/migration_payment_gateway.md — plano técnico de migração se necessário
- [P2] Cadência mensal de revisão de trigger de ativação (1ª segunda do mês)
- [P3] Modelo de sazonalidade no plano de ativação (ativar entrada da primavera)
- [P3] Fase 3 (marketplace, professor, plano PRO): RICE pré-Sprint 15
```

---

## 8. Trigger para Próxima Revisão de Monetização

Refazer auditoria quando:
- Após primeiro torneio pago real em produção (atualizar unit economics com dados reais)
- AbacatePay anunciar split (revisar gap 3.1)
- Atingir 5 clubes ativos (preparar ativação)
- Cash runway do Rafael < 4 meses (ativar antes do plano se necessário)
