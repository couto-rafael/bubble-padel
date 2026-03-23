# BubblePadel — Baseline Metrics + KPIs do Beta

## Task 1.T3

**Data de captura:** Março 2026 | **Responsável:** Rafael Couto

---

## 1. Estado Atual (Baseline — pré-monetização)

| Métrica                        | Valor Atual                    | Como medir              |
| ------------------------------ | ------------------------------ | ----------------------- |
| Torneios criados               | A preencher no início do alpha | Dashboard admin / banco |
| Atletas inscritos (total)      | A preencher                    | Tabela teams            |
| Torneios completos (COMPLETED) | A preencher                    | Filtro status=COMPLETED |
| NPS organizadores              | — (sem dados ainda)            | Formulário pós-torneio  |
| Emails enviados                | 0 (feature nova)               | Logs Resend             |

---

## 2. KPIs do Alpha (Sprint 2 — 1-2 clubes)

| KPI                                | Meta                | Bloqueador se não atingir? |
| ---------------------------------- | ------------------- | -------------------------- |
| Torneios completos sem bug crítico | ≥ 1                 | Sim                        |
| NPS do organizador                 | ≥ 7                 | Sim                        |
| Emails de confirmação entregues    | 100% das inscrições | Não                        |
| Tempo médio para criar torneio     | < 10 minutos        | Não                        |
| Erros 500 em produção              | 0                   | Sim                        |

---

## 3. KPIs do Beta (Sprint 3 — 5-10 clubes)

| KPI                                | Meta                   | Bloqueador se não atingir? |
| ---------------------------------- | ---------------------- | -------------------------- |
| Torneios completos                 | ≥ 3                    | Sim — Go/No-Go             |
| NPS organizadores                  | ≥ 7 (mín. 3 respostas) | Sim — Go/No-Go             |
| Pagamento PIX processado           | ≥ 1 real               | Sim — Go/No-Go             |
| Bugs críticos (2 semanas)          | 0                      | Sim — Go/No-Go             |
| Clubes ativos (usaram 2+ torneios) | ≥ 2                    | Não                        |
| Depoimentos utilizáveis            | ≥ 2                    | Não                        |

---

## 4. Critérios de Go/No-Go — Beta → Lançamento Público

Todos os 4 critérios abaixo devem ser atendidos para abrir o cadastro self-service:

- [ ] **NPS ≥ 7** — média dos organizadores do beta (mínimo 3 respostas)
- [ ] **3+ torneios completos** do início ao fim sem bug crítico
- [ ] **1+ pagamento PIX real** processado com sucesso
- [ ] **Zero bugs críticos** nas últimas 2 semanas de beta

**Responsável pela decisão:** Rafael Couto
**Data prevista para a reunião de Go/No-Go:** a definir após Sprint 3

---

## 5. Metas de Lançamento Público (Q2 2026)

| Métrica           | Meta Mês 1 | Meta Mês 3 | Meta Mês 6 |
| ----------------- | ---------- | ---------- | ---------- |
| Clubes ativos     | 5          | 20         | 50         |
| Torneios/mês      | 10         | 40         | 100        |
| MRR (comissão)    | R$ 1.800   | R$ 7.200   | R$ 18.000  |
| NPS organizadores | ≥ 7        | ≥ 7.5      | ≥ 8        |

_Baseado em: média de 2 torneios/clube/mês × 30 duplas × 60 atletas × R$3 comissão_

---

## 6. Template de Relatório Semanal

**Semana de:** **_/_**/2026

| Área                     | Esta semana | Semana anterior | Tendência |
| ------------------------ | ----------- | --------------- | --------- |
| Torneios ativos          |             |                 |           |
| Novas inscrições         |             |                 |           |
| Emails enviados          |             |                 |           |
| Erros 500 (Railway logs) |             |                 |           |
| NPS (se coletado)        |             |                 |           |
| Receita de comissão      |             |                 |           |

## **Principais eventos da semana:**

- **Ações para próxima semana:**

-
- ***

## 7. Definição de Sucesso por Fase

**Alpha:** clube organiza 1 torneio completo, atletas recebem email, NPS ≥ 7.

**Beta:** primeiro PIX real, 3 torneios completos, zero bugs críticos em 2 semanas.

**Lançamento:** 5 clubes ativos no primeiro mês, MRR > R$ 1.000.
