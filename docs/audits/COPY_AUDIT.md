# COPY_AUDIT — Bubble Padel

**Auditor:** copy-specialist
**Data:** 17-jun-2026
**Escopo:** Estado do copy pós-Sprint 9, baseline pré-Sprint 10
**Referências:** `EmailService.ts` (9 templates) · `Home.tsx` · `Footer.tsx` · `AthleteHeader.tsx` · `DashboardHeader.tsx` · `feedback_beta_2T4.md` · userMemories Sprint 9 (feed social copy)

---

## 1. Score Consolidado

**Nota geral: 6.0 / 10**

| Dimensão | Nota | Observação |
|---|---|---|
| Subjects de email transacional | 7 | ✅ Padrão emoji + ação respeitado |
| Corpo dos templates de email | 8 | ✅ Estrutura, tom e CTA consistentes |
| Landing page — Hero | 7 | ✅ Direto, ação clara |
| Landing page — FAQ + Cards | 4 | ❌ Inconsistências (gateway, app mobile) |
| Footer | 5 | ⚠️ Links mortos ("Sobre", "Blog", "Carreiras", "Segurança") |
| Headers de navegação | 6 | ⚠️ "Marketplace" promete feature inexistente |
| Empty states / erros (UI) | 5 | ⚠️ Não auditado in-loco, padrão indefinido |
| Consistência de marca (Bubble vs Bubble Padel) | 4 | ❌ Misturado em copy oficial |
| Copy do feed social (Sprint 9) | 6 | ⚠️ Implementado, precisa revisão visual |
| WhatsApp templates de feedback | 7 | ✅ Bem calibrados, tom certo |
| Emails de pagamento (PIX) | 0 | ❌ Não existem (task 3.T2 não fechou copy real) |

---

## 2. O Que Está OK ✅

### Subjects dos 9 emails transacionais
Padrão emoji + ação + torneio funcionando:
- 🎾 Inscrição recebida — {tournament}
- 🎾 Seu torneio é amanhã — {tournament}
- 🏆 Campeões! Parabéns pela vitória em {tournament}
- 🥈 Vice-campeões! Foi por muito pouco em {tournament}
- 🎾 Chegaram longe! {tournament} (eliminado playoffs)

### Templates de email — estrutura
- Header dark `#050f1a` com logo verde `#00ff88` consistente
- Corpo claro com tabela de dados (categoria, jogadores)
- CTA cyan `#00ccff` com texto ativo ("Ver dashboard financeiro →", "Gerenciar inscrições →")
- Footer com termos + email DPO
- Linguagem pessoal ("Sua inscrição", "Seu torneio")
- Comunica modelo de monetização atual no `sendRelatorioRepasse`: "✅ Durante o período de lançamento, a Bubble não cobra comissão"

### Hero da landing
- "Organize seu torneio de padel em 5 minutos" (skill original) — direto, com promessa quantificável
- CTA "Criar torneio grátis →" — verbo + grátis + seta = bom

### WhatsApp templates (feedback_beta_2T4)
- D+3 informal, D+7 com formulário, D+14 depoimento (se NPS ≥ 7)
- Tom pessoal ("Oi {nome}!", "aqui é o Rafael")
- Sem pressão, com escapatória ("sem pressão", "qualquer feedback")

### Feed Sprint 9 (declarado nas memórias)
- "CAMPEÃO" / "VICE" como badge dourado/prata em TROPHY card
- "Venceu" / "Perdeu" + parceiro + adversários no MATCH_RESULT
- Composer e ações de feed (like/comment/share) implementados

---

## 3. Gaps Identificados

### 🔴 BLOQUEADORES — copy faltando antes de qualquer torneio pago real

**3.1 — Emails de pagamento PIX nunca escritos (task 3.T2)**

Briefing/skill listam 4 emails pendentes, nenhum no `EmailService.ts`:
- PIX Gerado (QR criado, aguardando pagamento)
- Pagamento Confirmado (webhook)
- PIX Expirado (com link pra regenerar)
- Reembolso Processado

**Impacto**: atleta paga inscrição → não recebe nenhuma comunicação. Tudo acontece silenciosamente no `PaymentService.ts`. Quebra brutal de tom da marca ("celebração de conquistas" não pode começar com "você pagou — silêncio").

**Ação**: redigir 4 templates em Sprint 10 ou 11. Esforço estimado: 4h (1h cada).

**3.2 — Footer DPO `privacidade@bubblepadel.com` cita endereço que não existe**
Cruza com LEGAL 3.3 — domínio bubblepadel.com não está registrado nas memórias (parqueado em service account migration).

Todo email transacional fecha com "responda este email ou entre em contato em privacidade@bubblepadel.com". Endereço inexistente = email volta = atleta perde confiança.

**Ação**: registrar domínio + caixa funcional ANTES de qualquer clube real receber email.

### ⚠️ RISCO — qualidade prejudica conversão e marca

**3.3 — Landing page FAQ promete gateway errado (cruza LEGAL 3.6 / MONETIZATION 3.6)**

`Home.tsx` FAQ:
> "haverá a taxa padrão do gateway de pagamento (Mercado Pago, PagSeguro, etc)"

Realidade: AbacatePay (única integração). Clube lê e pode:
- Esperar maquininha física → frustração
- Comparar mentalmente com fee de cartão (4-5%) e achar caro → não converte
- Procurar Mercado Pago dashboard depois e não achar movimentação → suporte

**Correção sugerida** (tom Bubble):
> "Se você cobrar inscrição dos jogadores, há uma taxa do gateway PIX (cerca de 1% por inscrição). A taxa é do parceiro de pagamento, não da Bubble."

**3.4 — Landing page promete "App Mobile Completo"**

`Home.tsx` lista feature "App Mobile Completo / Experiência perfeita em qualquer dispositivo".

Realidade: web responsive, não app nativo. Debate #4 do briefing decidiu "Web responsivo primeiro. React Native após 50 clubes ativos".

**Risco**: clube baixa expectativa esperando app na App Store/Play Store, fica desapontado.

**Correção sugerida**:
> Title: "Funciona Direto no Celular"
> Description: "Acesso pelo navegador em qualquer dispositivo — sem instalar nada."

**3.5 — Cards de feature da landing genéricos demais**

"Gestão Automática / Chaves, agendamento e organização automatizados" — vago.

Tom Bubble pede concretude. Comparar com tom do CTA "Criar torneio grátis" (direto, ativo) — os cards puxam pra abstração corporativa.

**Sugestão de reescrita**:
- "Chaves Geradas em 1 Clique" → "A gente gera grupos e mata-mata na hora. Sem planilha."
- "Agendamento Automático" → "Diz os horários disponíveis. A Bubble distribui os jogos sem conflito."
- "Inscrições Online" → "Atletas se inscrevem pelo link. PIX cai direto na sua conta."

**3.6 — Footer com links fantasma**

`Footer.tsx`:
- "Sobre" → `href="#"` (link morto)
- "Blog" → `href="#"` (link morto)
- "Carreiras" → `href="#"` (link morto — Bubble é 1 pessoa)
- "Segurança" → `href="#"` (link morto)

3 problemas:
1. Clique vai pra lugar nenhum (UX quebrada)
2. "Carreiras" cria expectativa de empresa de 20 pessoas
3. "Blog" cria expectativa de conteúdo que não existe

**Sugestão**: remover Sobre/Blog/Carreiras/Segurança. Manter Empresa apenas com "Contato".

**3.7 — Menu "Marketplace" no AthleteHeader**

`AthleteHeader.tsx` tem link `/marketplace`. Marketplace é Fase 3 do briefing (100+ clubes / 5.000+ atletas). Não existe hoje.

**Risco**: atleta clica, vai pra 404 ou página vazia. Confusão sobre escopo do produto.

**Ação**: remover do menu até existir ou direcionar pra "Em breve" com explicação do que vai ter.

**3.8 — Inconsistência "Bubble" vs "Bubble Padel"**

Marca oficial (skill, briefing): **Bubble Padel**

Uso real:
- `EmailService.ts` header: "Bubble Padel" ✅
- `Footer.tsx`: "© 2026 Bubble" ❌
- Vários textos UI: alternam "Bubble" e "Bubble Padel"
- Domínio futuro: bubblepadel.com (sem espaço)

**Risco**: SEO fragmentado, atleta busca "Bubble Padel" e site não tem consistência, branding diluído.

**Recomendação**:
- **Bubble Padel** = nome oficial em todo texto público (landing, emails, termos, footer)
- "Bubble" só como nick interno (logs, código, fala casual de Rafael no WhatsApp)
- Title da landing, OG image, meta tags: "Bubble Padel"

**3.9 — Subjects longos podem cortar em clientes de email**

`sendNovaInscricaoParaClube` subject:
> "Nova inscrição: {player1Name} / {player2Name} — {tournamentName}"

Com nomes longos + torneio longo, passa de 60 caracteres. Gmail/Outlook cortam em 50-78 chars mobile.

**Exemplo problemático**: "Nova inscrição: Rafael Couto / Sara Silva — Open Masculino Smoke Test B1 Sprint 9"

**Correção** (54 chars máx + emoji):
> "🎾 Nova dupla: {player1Name} & {player2Name}"
ou
> "🎾 +1 inscrição em {tournamentName}"

### ✅ RECOMENDADO — polish de marca

**3.10 — Empty states e mensagens de erro não auditados in-loco**

Não localizei copy literal de empty states (sem torneios, sem ligas, sem amigos, feed vazio) nem mensagens de erro de form/API no que busquei.

Suspeita: padrão inconsistente (algumas "Sem dados" técnicas, outras "Nada por aqui ainda" no tom).

**Ação Sprint 10/11**: passar página por página listando empty states + erros, padronizar.

**3.11 — Copy do feed social novo (Sprint 9) precisa revisão visual**

Memórias mencionam:
- Composer com placeholder
- Like / comment / share actions
- TROPHY card "CAMPEÃO" / "VICE"
- MATCH_RESULT card com "Venceu" / "Perdeu"

Não vi o copy literal — precisa revisar no produto rodando se segue tom Bubble:
- Placeholder do composer ("O que tá rolando, [nome]?" ou similar)
- Texto de like vazio ("Ninguém curtiu ainda" vs "Seja o primeiro a curtir")
- Empty feed ("Nada por aqui ainda. Adiciona amigos pra ver o que tá rolando")

**Ação**: revisão visual em Sprint 10 — Rafael grava 1 vídeo de tela do feed, eu (copy-specialist) reviso e proponho ajustes.

**3.12 — Faltam templates de WhatsApp pra ativação de cobrança**

Quando ativar comissão (cruza MONETIZATION 3.4), Rafael precisa avisar clubes 30 dias antes. Template não existe.

**Ação**: pré-Sprint de ativação, redigir template WhatsApp + email de comunicação de início de cobrança. 1h.

**3.13 — Footer copyright "© 2026 Bubble"**

Manual ano = manual de manter atualizado. Em janeiro/2027 vira dívida visual.

**Sugestão**: `© {new Date().getFullYear()} Bubble Padel`.

---

## 4. Tabela de Tom — Casos Verificados

| Situação | Copy Atual | Tom Bubble? | Veredito |
|---|---|---|---|
| Inscrição recebida (subject) | "🎾 Inscrição recebida — {tournament}" | ✅ | OK |
| Inscrição recebida (corpo) | "🎾 Inscrição recebida! / Sua inscrição no torneio foi registrada com sucesso." | ✅ | OK |
| Lembrete D-1 | "🎾 Seu torneio é amanhã — {tournament}" | ✅ | OK |
| Campeão (subject) | "🏆 Campeões! Parabéns pela vitória em {tournament}" | ✅ | OK |
| Vice (subject) | "🥈 Vice-campeões! Foi por muito pouco em {tournament}" | ✅ Excelente, mantém tom positivo no segundo lugar | OK |
| PIX pra parceiro (subject) | "🎾 {player1} te inscreveu em {tournament} — pague sua parte" | ✅ Direto, com contexto | OK |
| Repasse R$0 comissão | "✅ Durante o período de lançamento, a Bubble não cobra comissão. O valor total das inscrições pagas é integralmente seu." | ✅ Reforça posicionamento Sprint 3 | OK |
| FAQ gateway | "Mercado Pago, PagSeguro, etc" | ❌ Errado tecnicamente | FIX |
| Feature card | "App Mobile Completo" | ❌ Promete o que não tem | FIX |
| Footer link Carreiras | "Carreiras" → `#` | ❌ Stub corporativo + link morto | REMOVE |

---

## 5. Recomendações Priorizadas

| # | Ação | Prioridade | Esforço |
|---|---|---|---|
| 1 | Registrar bubblepadel.com + caixa privacidade@ (cruza LEGAL P0) | 🔴 | 4h |
| 2 | Redigir 4 emails de pagamento PIX (gerado, confirmado, expirado, reembolso) | 🔴 | 4h |
| 3 | Corrigir FAQ Home.tsx — gateway AbacatePay (cruza LEGAL/MONETIZATION) | 🔴 | 30min |
| 4 | Corrigir card "App Mobile Completo" → "Funciona Direto no Celular" | ⚠️ | 30min |
| 5 | Reescrever 3 cards de feature da landing (mais concretos) | ⚠️ | 2h |
| 6 | Remover links mortos do Footer (Sobre/Blog/Carreiras/Segurança) | ⚠️ | 30min |
| 7 | Remover ou stub "Marketplace" do AthleteHeader | ⚠️ | 15min |
| 8 | Padronizar "Bubble Padel" como nome oficial em todo copy público | ⚠️ | 1h |
| 9 | Subjects longos: encurtar `sendNovaInscricaoParaClube` | ✅ | 15min |
| 10 | Footer `© ${new Date().getFullYear()}` | ✅ | 5min |
| 11 | Auditoria visual de empty states / erros (passar página por página) | ✅ | 3h |
| 12 | Revisão visual do feed social Sprint 9 (placeholders, empty) | ✅ | 1h + 30min de tela do Rafael |
| 13 | Templates WhatsApp + email de ativação de cobrança | ✅ | 1h |

**Total quick wins (1, 3, 4, 6, 7, 8, 9, 10): ~7h — destrava muita coisa**

---

## 6. Itens Sugeridos para BACKLOG.md

```
## Copy / Comunicação

- [P0] Redigir 4 templates de email PIX: gerado, confirmado, expirado, reembolso (task 3.T2 reabrir)
- [P0] Corrigir Home.tsx FAQ: substituir "Mercado Pago, PagSeguro" por "gateway PIX parceiro (~1%)" — cruza LEGAL/MONETIZATION
- [P0] Domínio bubblepadel.com + caixa privacidade@ (cruza LEGAL/MONETIZATION P0)
- [P1] Reescrever card "App Mobile Completo" → "Funciona Direto no Celular"
- [P1] Reescrever 3 cards de feature da landing com tom concreto (não abstrato)
- [P1] Remover Footer links mortos: Sobre, Blog, Carreiras, Segurança
- [P1] Remover ou stub "Marketplace" do AthleteHeader (não existe até Fase 3)
- [P2] Padronizar "Bubble Padel" como nome oficial em todo copy público (footer, OG, meta)
- [P2] Encurtar subjects longos (sendNovaInscricaoParaClube)
- [P2] Footer copyright dinâmico © {new Date().getFullYear()}
- [P3] Auditoria visual de todos os empty states / mensagens de erro — passar página a página
- [P3] Revisão do copy do feed social Sprint 9 (placeholders, empty states) — Rafael grava tela
- [P3] Template WhatsApp + email de ativação de cobrança (para 30d antes do trigger)
```

---

## 7. Trigger para Próxima Revisão de Copy

Refazer auditoria quando:
- Antes do primeiro torneio externo real (revisar emails PIX + FAQ + landing)
- Antes da ativação de cobrança (validar templates de comunicação)
- Quando feed social tiver 30+ posts reais (revisar tom dos auto-posts em contexto)
- A cada nova feature B2C com texto exposto ao atleta
