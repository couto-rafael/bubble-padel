# BubblePadel — Copy dos Emails de Pagamento
## Task 3.T2
**Data:** Março 2026 | **Para implementar no EmailService — Sprint 3**

---

## Variáveis disponíveis
- `{nome_jogador}` — nome do player1
- `{nome_torneio}` — nome do torneio
- `{categoria}` — categoria inscrita
- `{valor}` — valor da inscrição formatado (ex: R$ 80,00)
- `{link_torneio}` — URL pública do torneio
- `{link_pix}` — link de pagamento (copia e cola ou deep link)
- `{expiracao}` — tempo restante para o PIX expirar

---

## Email 1 — PIX Gerado (Aguardando Pagamento)

**Gatilho:** imediatamente após geração do QR Code
**Assunto:** `🎾 Finalize sua inscrição em {nome_torneio} — PIX aguardando`

---

Olá, {nome_jogador}!

Sua inscrição na categoria **{categoria}** do torneio **{nome_torneio}** foi registrada. Para confirmar sua vaga, realize o pagamento via PIX:

**Valor:** {valor}
**Expira em:** {expiracao}

Abra o app do seu banco, escolha "Pagar com PIX" e use o código abaixo ou escaneie o QR Code na página do torneio.

**[Ver QR Code e código PIX →]({link_torneio})**

Após o pagamento, você receberá a confirmação em instantes. ⚡

Dúvidas? Responda este email ou entre em contato com o organizador do torneio.

Abraços,
Time Bubble Padel

---
*Se você não fez esta inscrição, ignore este email.*

---

## Email 2 — Pagamento Confirmado ✅

**Gatilho:** webhook do gateway confirma pagamento
**Assunto:** `✅ Inscrição confirmada! Até logo no {nome_torneio}`

---

Olá, {nome_jogador}!

Seu pagamento foi recebido e sua inscrição está **confirmada**! 🎉

**Torneio:** {nome_torneio}
**Categoria:** {categoria}
**Status:** ✅ Inscrito e confirmado

Fique de olho na página do torneio — em breve o organizador irá divulgar os grupos, horários e quadras.

**[Acompanhar o torneio →]({link_torneio})**

Bom jogo! 🎾

Abraços,
Time Bubble Padel

---

## Email 3 — PIX Expirado ⏰

**Gatilho:** QR Code expira sem pagamento (após 30 minutos)
**Assunto:** `⏰ Seu PIX expirou — gere um novo para garantir sua vaga`

---

Olá, {nome_jogador}!

O código PIX para sua inscrição em **{nome_torneio}** expirou sem ser pago.

Não se preocupe — sua vaga ainda pode estar disponível! Acesse a página do torneio para gerar um novo código e finalizar sua inscrição.

**[Gerar novo PIX →]({link_torneio})**

⚠️ As vagas são limitadas. Se o torneio estiver cheio, sua inscrição não poderá ser confirmada.

Abraços,
Time Bubble Padel

---

## Email 4 — Reembolso Processado 💸

**Gatilho:** clube marca inscrição como reembolsada (ação manual)
**Assunto:** `💸 Reembolso de {valor} processado — {nome_torneio}`

---

Olá, {nome_jogador}!

Seu reembolso referente à inscrição em **{nome_torneio}** foi processado pelo organizador.

**Valor:** {valor}
**Prazo:** até 5 dias úteis para aparecer na sua conta, dependendo do banco.

Se tiver dúvidas sobre o reembolso, entre em contato diretamente com o organizador do torneio pela página abaixo.

**[Ver torneio →]({link_torneio})**

Esperamos te ver em um próximo torneio! 🎾

Abraços,
Time Bubble Padel

---

## Notas de implementação (para dev — Sprint 3)

### Funções a criar no EmailService.ts:
```typescript
sendPixGerado(data: { player1Email, player2Email, player1Name, tournamentName, category, valor, linkTorneio, expiracao })
sendPagamentoConfirmado(data: { player1Email, player2Email, player1Name, tournamentName, category, linkTorneio })
sendPixExpirado(data: { player1Email, player2Email, player1Name, tournamentName, linkTorneio })
sendReembolsoProcessado(data: { player1Email, player1Name, tournamentName, valor, linkTorneio })
```

### Gatilhos no backend:
- Email 1: `POST /api/payments/pix/create` → após gerar cobrança
- Email 2: `POST /api/webhooks/pix` → quando status = PAID
- Email 3: job cron a cada 5min verificando cobranças expiradas
- Email 4: endpoint admin/clube que marca como reembolsado
