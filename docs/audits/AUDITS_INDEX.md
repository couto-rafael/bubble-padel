# AUDITS_INDEX — Bubble Padel

**Data:** 17-jun-2026
**Escopo:** Snapshot estratégico pós-Sprint 9, baseline pré-Sprint 10
**Auditorias:** Legal · Monetization · Product Strategy · Copy · Gamification
**Status UX_AUDIT.md:** existente (atualizado por ui-specialist, fora desta rodada)

---

## 1. Radar Consolidado

| Auditoria | Nota | Range |
|---|---|---|
| LEGAL_AUDIT | **6.2** / 10 | Termos OK; DPA + DPO + domínio bloqueiam |
| MONETIZATION_AUDIT | **5.7** / 10 | Infra OK; split + NPS + ativação bloqueiam |
| PRODUCT_STRATEGY_AUDIT | **5.0** / 10 | Produto pré-alpha, declarado pré-lançamento |
| COPY_AUDIT | **6.0** / 10 | Emails OK; landing + 4 PIX templates faltam |
| GAMIFICATION_AUDIT | **5.8** / 10 | Achievements OK; Super8 quebrado, B2B zerado |
| **Média** | **5.7 / 10** | — |

**Leitura crítica:** produto está em "boa qualidade técnica + má prontidão operacional". Sprint 9 entregou robustez de código; Sprints 7-9 não moveram o número que conta (clube externo pagante).

---

## 2. Cross-Cutting Findings (mesmo problema, múltiplas auditorias)

### 🔴 CC-1 — Domínio bubblepadel.com não registrado
**Citado em:** LEGAL 3.2, 3.3 · MONETIZATION 3.3 · COPY 3.2

**Cascata:**
- Sem domínio → Resend não verifica → emails não saem pra atletas/clubes reais
- Sem domínio → caixa privacidade@ não existe → DPO ausente (LGPD Art. 41)
- Sem domínio → OG image/landing não tem URL canônica → SEO defeituoso
- Sem domínio → service accounts ficam no email pessoal do Rafael

**Esforço:** 4h (registro + DNS + verificação Resend)
**Destrava:** comunicação real com qualquer clube externo

### 🔴 CC-2 — Pré-alpha disfarçado de pré-lançamento
**Citado em:** PRODUCT 3.1, 3.2 · MONETIZATION 3.2 · GAMIFICATION (premissa do roadmap)

**Cascata:**
- Zero clube externo → zero NPS → critério #1 do go/no-go nunca medido
- Zero NPS → ativação de cobrança fica indefinida → sem trigger
- Sem trigger → Sprint 10/11/12 viram "mais hardening" indefinidamente
- Sem clube real → features Sprint 7-9 (atleta) construídas sem validação B2B

**Esforço:** 2-8h outreach Rafael (sem código)
**Destrava:** ciclo de validação inteiro

### 🔴 CC-3 — FAQ Home.tsx erra gateway
**Citado em:** LEGAL 3.6 · MONETIZATION 3.6 · COPY 3.3

**Cascata:**
- "Mercado Pago, PagSeguro" no FAQ vs AbacatePay real
- Clube espera maquininha física → frustração
- CDC Art. 31 (informação clara) → risco legal de publicidade enganosa
- Atleta procura Mercado Pago dashboard → suporte

**Esforço:** 30min (uma frase)
**Destrava:** consistência básica de marca

### 🔴 CC-4 — Feed social Sprint 9 sem cobertura legal
**Citado em:** LEGAL 3.4 · GAMIFICATION (loop social depende disso)

**Cascata:**
- @mentions processam dado de terceiro sem base documentada
- TROPHY/MATCH_RESULT auto-gerados expõem nome em feed de outros sem cláusula
- LGPD Art. 7º VI cabe, mas não está escrito

**Esforço:** 2h (seção na Política de Privacidade)
**Destrava:** lançamento social legalmente coberto

### ⚠️ CC-5 — NPS é critério de go/no-go sem instrumento
**Citado em:** MONETIZATION 3.2 · PRODUCT 3.1

**Cascata:**
- Critério go/no-go #1 (NPS ≥ 7) sem coleta
- Sem NPS → não há decisão formal de ativar/manter/parar
- Email D+1 pós-torneio com link de formulário (Tally/Forms) destrava

**Esforço:** 4h (email automático + formulário + queue)

---

## 3. P0 Consolidado (ordem de execução)

Lista deduplicada das 5 auditorias. Itens marcados [CC-N] cruzam múltiplas dimensões.

| # | Ação | Esforço | Cross-ref |
|---|---|---|---|
| 1 | Registrar bubblepadel.com + verificar Resend | 4h | CC-1 |
| 2 | Criar caixa privacidade@bubblepadel.com | 1h | CC-1 |
| 3 | Solicitar/arquivar DPAs (Resend, AbacatePay, Cloudinary) | 6h | — |
| 4 | Outreach pra 2 clubes amigos (alpha real) | 2-8h | CC-2 |
| 5 | Email automático D+1 pós-torneio com link de NPS | 4h | CC-5 |
| 6 | Decisão técnica: aguardar split AbacatePay vs migrar Asaas | 8h spike | — |
| 7 | Super8 auto-post (TROPHY + MATCH_RESULT) | 6h | — |
| 8 | Adicionar seção "Feed Social" na Política de Privacidade | 2h | CC-4 |
| 9 | Redigir 4 templates de email PIX (gerado, confirmado, expirado, reembolso) | 4h | — |
| 10 | Corrigir FAQ Home.tsx — gateway AbacatePay | 30min | CC-3 |
| 11 | Definir e comunicar North Star Metric | 1h decisão | — |
| 12 | Query baseline KPIs (torneios criados/completos, atletas únicos) | 2h | — |
| 13 | Reframe Sprint 10 como Sprint Alpha (replanning) | 1h | CC-2 |

**Total P0: ~42h de execução + 30min decisão North Star + 8h spike**

Se Sprint 10 tem ~80h de orçamento (similar a Sprint 9), P0 cabe na sprint **se restringir o escopo** e aceitar P1 pra Sprint 11.

---

## 4. P1 e P2 Recomendados

### P1 — Sprint 11 (ou cauda da 10)
- Reescrever 3 cards de feature da landing (concretos vs abstratos) — COPY 3.5
- Remover Footer links mortos (Sobre/Blog/Carreiras/Segurança) — COPY 3.6
- Remover "Marketplace" do AthleteHeader — COPY 3.7
- Card "Total arrecadado via Bubble" no ClubDashboard — MONETIZATION 3.7
- PIX QR Code inline (substituir nova aba) — MONETIZATION 3.5
- Padronizar "Bubble Padel" como nome oficial — COPY 3.8
- Verificação de menores (data nascimento + responsável) — LEGAL 3.5
- Iniciar Torneio CLOSED→ONGOING — PRODUCT (UX clube)
- Edit placar Playoffs — PRODUCT (UX clube)
- Sets múltiplos persistindo — PRODUCT (data integrity)
- Validação gênero por categoria — PRODUCT (data integrity)
- "Última Caminhada" no AthleteProfile (top 4/top 8) — GAMIFICATION 3.3
- Oitavas/16avos pontos de liga — GAMIFICATION 3.2

### P2 — Sprint 12+
- 3 badges de clube (B2B gamification) — GAMIFICATION 3.6
- Email de conquista desbloqueada — GAMIFICATION 3.4
- Plano de incidente LGPD — LEGAL 3.7
- docs/migration_payment_gateway.md — MONETIZATION 3.9
- Image gen de badge (depende public profile) — GAMIFICATION 3.5
- Email semanal "Sua semana no Bubble" — GAMIFICATION 3.10

---

## 5. Recomendação Estratégica para Sprint 10

### Decisão necessária do Rafael

**(A) Manter "Pré-lançamento Hardening"** — escopo original, foco em bugs + UX clube
**(B) Reframe para "Sprint Alpha"** — meta única = 1-2 clubes externos rodando torneio real até 31-jul-2026

### Argumentos para (B)
1. PRODUCT 3.1 — go/no-go documentado nunca executado em 2+ meses
2. CC-2 — produto está 2 fases atrás do declarado
3. MONETIZATION 3.2 — sem clube real, NPS impossível, ativação indefinida
4. Sprint 9 entregou social (atleta) sem ter base B2B — princípio "clube primeiro" violado

### Argumento para (A)
1. Bugs reais existem (Super8, sets múltiplos, validação gênero) — clube novo expõe esses
2. Hardening reduz risco do primeiro contato real com clube externo

### Recomendação dos auditores
**Híbrido**: Sprint 10 = "Sprint Alpha" com:
- 70% código: bugs P0 + Super8 + emails PIX + correções de landing
- 30% não-código: outreach Rafael pros 2 clubes + setup NPS + outreach domínio
- **Definition of Done:** 1 clube externo cadastrado + 1 torneio criado (não necessariamente rodado)

Sprint 11 = "Sprint Alpha Run" — rodar o primeiro torneio externo do início ao fim, coletar NPS, decidir go/no-go.

---

## 6. Próximas Revisões de Auditoria

| Auditoria | Trigger pra reauditar |
|---|---|
| LEGAL | Antes do 1º torneio externo · Antes de ativar cobrança · Após incidente |
| MONETIZATION | Após 1º PIX real · Quando AbacatePay split lançar · 5 clubes ativos |
| PRODUCT_STRATEGY | Após alpha real (1 torneio externo) · Pré go/no-go formal · 8 semanas sem mover NSM |
| COPY | Antes do 1º torneio externo · Antes da ativação · Feed com 30+ posts reais |
| GAMIFICATION | Após 50 atletas com Gold+ · Após 1ª liga de temporada completa |

---

## 7. Arquivos desta Rodada

- `docs/audits/LEGAL_AUDIT.md` (6.2/10)
- `docs/audits/MONETIZATION_AUDIT.md` (5.7/10)
- `docs/audits/PRODUCT_STRATEGY_AUDIT.md` (5.0/10)
- `docs/audits/COPY_AUDIT.md` (6.0/10)
- `docs/audits/GAMIFICATION_AUDIT.md` (5.8/10)
- `docs/audits/AUDITS_INDEX.md` (este arquivo)
- `docs/UX_AUDIT.md` (pré-existente, fora desta rodada)
