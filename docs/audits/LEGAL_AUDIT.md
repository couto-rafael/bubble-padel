# LEGAL_AUDIT — Bubble Padel

**Auditor:** legal-compliance specialist
**Data:** 17-jun-2026
**Escopo:** Estado legal/compliance pós-Sprint 9, baseline pré-Sprint 10
**Referências:** `bubble_padel_briefing.html` §9 · `termos_legais_1T1.md` · `compliance_pagamento_3T1.md` · `kpis_baseline_1T3.md` · TermsPage.tsx · userMemories Sprint 9

---

## 1. Score Consolidado

**Nota geral: 6.2 / 10** (subiu de 2 do briefing original — Sprint 1+3 entregaram base)

| Dimensão | Nota | Tendência |
|---|---|---|
| Termos de Uso (Clube + Atleta) | 8 | ↗ Publicados, com aceite versionado |
| Política de Privacidade (LGPD) | 7 | → Texto OK, fluxos operacionais não testados |
| Compliance de Pagamento | 7 | → Reembolso definido, fluxo manual |
| Responsabilidade & Riscos | 6 | → Isenção lesão OK, menor não verificado |
| DPAs com subprocessadores | 3 | ❌ Não confirmados (Resend, AbacatePay, Cloudinary) |
| Operacional (DPO, incidente) | 4 | ❌ DPO existe mas processo não documentado |
| Adequação Sprint 9 (feed/mentions) | 4 | ❌ Sprint 9 introduziu tratamentos não cobertos pelos termos |

---

## 2. O Que Está OK ✅

### Documentos publicados (Sprint 1)
- Termos de Uso — Clube (`/termos`, aba Clubes)
- Termos de Participação — Atleta (`/termos`, aba Atletas)
- Política de Privacidade (`/termos`, aba Privacidade + `/privacidade` redireciona)
- Versionamento: `termsVersion` no schema, `lgpdAcceptedAt` em Team e Club
- Foro: Joinville/SC

### Base legal documentada (LGPD)
- Art. 7º V (execução de contrato): inscrição, cobrança, emails transacionais
- Art. 7º VI (legítimo interesse): resultados públicos, métricas anônimas
- Art. 7º II (obrigação legal): registros fiscais 5 anos (CTN Art. 195)

### Reembolso (Sprint 3 — task 3.T1)
- Atleta: 48h antes = integral; menos = sem reembolso
- Clube cancela: reembolso obrigatório, prazo 7 dias
- Clube processa manualmente (Bubble não intermedia dinheiro)

### Isenção de responsabilidade
- Lesões durante torneio: clube é o responsável pelo evento
- Bubble = provedor de aplicação (Marco Civil)

---

## 3. Gaps Identificados

### 🔴 OBRIGATÓRIO — Bloqueadores

**3.1 — DPAs com subprocessadores não confirmados**
- Resend (EUA): processa nome + email de atletas → transferência internacional. Sem DPA assinado, exposição direta LGPD Art. 33.
- AbacatePay (BR): processa dados de pagamento. Política do parceiro citada, mas sem confirmação de DPA bilateral.
- Cloudinary (EUA): fotos de perfil e logos de clube. Idem Resend.
- **Risco**: ANPD pode autuar em fiscalização espontânea ou após incidente.
- **Ação**: solicitar e arquivar DPA dos 3 provedores antes do primeiro torneio pago em produção real.

**3.2 — Verificação de domínio Resend pendente**
- Memórias confirmam: "Resend emails only reach verified address until domain verified".
- Implicação: clubes reais cadastrados hoje não recebem email → quebra de contrato (termos prometem confirmação por email).
- **Ação**: registrar domínio bubblepadel.com (memorando service migration está parado no backlog) e verificar Resend antes de qualquer torneio com clube externo.

**3.3 — DPO sem endereço operacional**
- `privacidade@bubblepadel.com` está nos termos, mas memórias indicam que migração de email do pessoal para business está parqueada ("Service account migration").
- **Risco**: titular não consegue exercer direito de acesso/exclusão (LGPD Art. 18) → autuação automática.
- **Ação**: registrar domínio + criar caixa funcional antes de Sprint 10 fechar.

### ⚠️ RISCO — Atenção pré-lançamento

**3.4 — Sprint 9 (feed social) introduziu tratamentos não cobertos pelos termos**

Sprint 9 entregou: posts auto-gerados (MATCH_RESULT, TROPHY), likes, comentários, @mentions com hidratação de nome/nickname.

| Tratamento | Coberto nos termos? | Base legal aplicada |
|---|---|---|
| Post auto-gerado com nome do parceiro/adversário | ❌ Não | Implícito legítimo interesse — não documentado |
| @mention renderiza nickname/fullName de outro atleta | ❌ Não | Idem |
| Post de TROPHY exibe categoria + torneio + colocação | ⚠️ Parcial | Art. 7º VI (resultado público), mas exibição em feed individual não citada |
| Settings `matches: PUBLIC/PRIVATE` | ✅ Gate respeitado em auto-post | OK |

**Ação**: revisar Política de Privacidade adicionando seção "Feed Social — Exposição de Dados" que documente:
- Que nome/nickname/resultado de torneio aparecem em feed de outros atletas
- Base legal: legítimo interesse (relação social esportiva) + opt-out via `settings.matches = PRIVATE`
- Direito de remoção: post pode ser deletado pelo autor, dado original (match result) é fato esportivo público

**3.5 — Verificação de menores não implementada**
- Backlog (1.T1) menciona "consentimento explícito de menor (campo no formulário se < 18 anos) — Sprint 4".
- Sprint 4 fechou sem isso. Briefing §9 marca como MÉDIO.
- **Risco**: torneio recebe inscrição de menor sem autorização → clube e Bubble respondem solidariamente.
- **Ação Sprint 10 ou Sprint 11**: adicionar campo "data de nascimento" no cadastro do atleta + bloqueio/checkbox de responsável se < 18.

**3.6 — Inconsistência entre copy do site e contratos reais**
- `Home.tsx` FAQ menciona "Mercado Pago, PagSeguro, etc" como gateway.
- Realidade técnica: AbacatePay (única integração).
- **Risco**: CDC Art. 31 (informação clara e correta sobre o serviço) — pode ser considerado publicidade enganosa.
- **Ação**: corrigir copy do Home.tsx para refletir AbacatePay, ou genérico "gateway PIX parceiro" sem nomear concorrentes.

### ✅ RECOMENDADO — Melhoras de postura

**3.7 — Plano de resposta a incidente de dados**
- LGPD Art. 48: comunicar ANPD em 24h e titulares afetados em prazo razoável.
- Não há documento de procedimento (quem detecta, quem comunica, template de notificação).
- **Ação**: criar `docs/incident_response_lgpd.md` com fluxo (detecção → contenção → comunicação ANPD → comunicação titulares).

**3.8 — Cookies banner / Marco Civil**
- Termos mencionam "cookies essenciais" — confirmar implementação real (sem banner se só essenciais).
- Se houver Google Analytics ou similar não documentado, banner é obrigatório.

**3.9 — Cláusula de uso de imagem em fotos de torneio**
- Briefing menciona "publicar nome e informações do torneio em landing/redes".
- Termos não cobrem: fotos tiradas no evento, vídeo de premiação, uso publicitário.
- **Ação**: adicionar cláusula em Termos Atleta sobre cessão de imagem (limitada ao evento) ou opt-in explícito.

---

## 4. Adequação ao Tema da Sprint 10 (Pré-lançamento Hardening)

| Item da Sprint 10 (declarado) | Impacto legal |
|---|---|
| Super8 auto-post crítico | Mesmo regime da gap 3.4 — cobertura nos termos |
| UserType TS fix | Sem impacto legal |
| Race 401 mount | Sem impacto legal direto |
| Validação gênero por categoria | Atenção a discriminação — categoria por gênero é prática esportiva legítima, mas comunicação deve ser respeitosa |
| Iniciar Torneio CLOSED→ONGOING | Sem impacto legal |
| Edit placar Playoffs | Sem impacto legal direto |
| Sets múltiplos não persistem | Indireto: resultado é dado público — perda de dados de placar pode gerar disputa entre atletas, Bubble não pode mediar |
| Banner CAMPEÕES público | Gap 3.4 — exposição de nome em página pública precisa estar nos termos (já está, OK) |

---

## 5. Recomendações Priorizadas (ordem de execução)

| # | Ação | Prioridade | Esforço | Bloqueia lançamento? |
|---|---|---|---|---|
| 1 | Registrar domínio bubblepadel.com + verificar Resend | 🔴 | 4h | Sim |
| 2 | Criar caixa funcional `privacidade@bubblepadel.com` | 🔴 | 1h | Sim (LGPD) |
| 3 | Solicitar DPAs (Resend, AbacatePay, Cloudinary) e arquivar | 🔴 | 6h | Sim (LGPD) |
| 4 | Adicionar seção "Feed Social" na Política de Privacidade | ⚠️ | 2h | Sim |
| 5 | Corrigir copy `Home.tsx` (Mercado Pago/PagSeguro → AbacatePay) | ⚠️ | 30min | Não, mas urgente |
| 6 | Documentar fluxo de incidente LGPD (`incident_response_lgpd.md`) | ✅ | 3h | Não |
| 7 | Verificação de menor (data nascimento + responsável) | ⚠️ | 6h | Não, mas antes de torneio infantojuvenil |
| 8 | Cláusula de imagem em Termos Atleta | ✅ | 1h | Não |

**Total para destravar lançamento (itens 1-5): ~14h**

---

## 6. Itens Sugeridos para BACKLOG.md

```
## Legal / Compliance

- [P0] Registrar domínio bubblepadel.com + verificar Resend (bloqueia comunicação real)
- [P0] Criar caixa privacidade@bubblepadel.com (LGPD Art. 41 — encarregado operacional)
- [P0] Arquivar DPAs: Resend, AbacatePay, Cloudinary (LGPD Art. 33 — transferência internacional)
- [P1] Atualizar Política de Privacidade com seção "Feed Social" cobrindo posts auto-gerados, @mentions e configuração matches PUBLIC/PRIVATE
- [P1] Corrigir copy Home.tsx FAQ: substituir "Mercado Pago, PagSeguro" por "AbacatePay" ou "gateway PIX parceiro"
- [P2] Criar docs/incident_response_lgpd.md com fluxo de notificação ANPD em 24h
- [P2] Adicionar campo data_nascimento + bloqueio/checkbox responsável se < 18 anos
- [P3] Adicionar cláusula de cessão de imagem em Termos Atleta (limitada ao evento)
```

---

## 7. Trigger para Próxima Revisão Legal

Refazer auditoria quando:
- Antes do primeiro torneio com clube externo real (revisar itens 1-5)
- Antes de ativar cobrança de comissão (revisar contrato Bubble↔Clube)
- Antes de aceitar inscrição de menor de idade (revisar gap 3.5)
- Após qualquer incidente de dados ou solicitação de titular não atendida
