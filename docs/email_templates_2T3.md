# BubblePadel — Templates de Email de Boas-vindas do Clube
## Task 2.T3
**Data:** Março 2026 | **Para implementar no EmailService (Sprint 3+)**

---

## Variáveis disponíveis
- `{nome_clube}` — nome do clube cadastrado
- `{nome_responsavel}` — nome do responsável pelo clube
- `{nome_torneio}` — nome do torneio criado
- `{N_inscricoes}` — número de inscrições recebidas
- `{link_dashboard}` — link direto para o dashboard
- `{link_torneio}` — link público do torneio

---

## Email 1 — Boas-vindas ao Bubble

**Gatilho:** imediatamente após o clube criar conta
**Assunto:** `Bem-vindo ao Bubble, {nome_clube}! 🎾`

---

Olá, {nome_responsavel}!

Seja bem-vindo ao Bubble — a plataforma que vai transformar a forma como você organiza torneios de padel e beach tennis.

**Seu clube está cadastrado e pronto para começar.**

Veja o que você pode fazer agora:

✅ Criar seu primeiro torneio em menos de 5 minutos
✅ Compartilhar o link de inscrições com os atletas
✅ Gerar grupos e schedule automaticamente
✅ Acompanhar placares e resultados em tempo real

**[Acessar meu dashboard →]({link_dashboard})**

Qualquer dúvida, responda este email. Estamos aqui para ajudar.

Abraços,
Time Bubble Padel

---
*Bubble Padel · Você está recebendo este email porque criou uma conta. · [Termos de Uso](https://bubblepadel.com/termos)*

---

## Email 2 — Primeiro Torneio Criado

**Gatilho:** quando o clube cria o primeiro torneio
**Assunto:** `"{nome_torneio}" está no ar! Próximo passo: abrir inscrições`

---

Olá, {nome_responsavel}!

Seu torneio **{nome_torneio}** foi criado com sucesso. 🎉

**Agora é hora de abrir as inscrições.**

Para receber os primeiros atletas, você precisa:

1. **Revisar as configurações** — categorias, datas e valor da inscrição
2. **Publicar o torneio** — muda o status para "Aberto"
3. **Compartilhar o link** — use o botão "Compartilhar" para enviar pelo WhatsApp

Quando os atletas se inscreverem, você receberá uma notificação por email para cada inscrição.

**[Ver meu torneio →]({link_torneio})**

Abraços,
Time Bubble Padel

---

## Email 3 — Primeiras Inscrições Recebidas

**Gatilho:** quando o torneio atinge 5 inscrições (threshold a definir)
**Assunto:** `{N_inscricoes} duplas inscritas em {nome_torneio}! Veja como confirmar`

---

Olá, {nome_responsavel}!

Seu torneio **{nome_torneio}** está bombando — você já tem **{N_inscricoes} duplas inscritas**! 🔥

**Próximo passo: confirmar as inscrições.**

Acesse a aba "Inscrições" no dashboard e revise cada dupla. Você pode:

- ✅ **Confirmar** as duplas que estão aptas a participar
- ❌ **Recusar** inscrições se necessário (com motivo)
- 📋 **Exportar** a lista completa em CSV

Quando tiver todas as duplas confirmadas, você poderá gerar os grupos automaticamente com um clique.

**[Gerenciar inscrições →]({link_dashboard})**

Qualquer dúvida sobre o processo, responda este email.

Abraços,
Time Bubble Padel

---

## Notas de implementação (para dev — Sprint 3+)

### Funções a criar no EmailService.ts:
```typescript
sendBoasVindasClube(data: { clubEmail, nomeResponsavel, nomeClube, linkDashboard })
sendPrimeiroTorneioCriado(data: { clubEmail, nomeResponsavel, nomeTorneio, linkTorneio, linkDashboard })
sendPrimeirasInscricoes(data: { clubEmail, nomeResponsavel, nomeTorneio, nInscricoes, linkDashboard })
```

### Gatilhos no backend:
- Email 1: `POST /api/auth/register` (criação de conta)
- Email 2: `POST /api/tournaments` (criação de torneio — verificar se é o primeiro)
- Email 3: `POST /api/public/tournaments/:id/register` (quando totalTeams === 5)
