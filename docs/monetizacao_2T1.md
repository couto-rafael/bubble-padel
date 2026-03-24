# BubblePadel — Modelo de Monetização

## Task 2.T1 — Decisão Oficial

**Data:** Março 2026 | **Responsável:** Rafael Couto

---

## 1. Modelo Atual (Lançamento — MVP)

### Premissa

Crescimento por volume antes de monetização. O objetivo é atingir a maior base possível de clubes e atletas antes de introduzir qualquer cobrança da Bubble.

### Como funciona o fluxo de pagamento

```
Atleta → QR Code PIX dinâmico → PIX direto para conta do Clube
```

1. Atleta clica em "Inscrever-se" no torneio
2. Sistema gera QR Code PIX dinâmico com valor definido pelo clube
3. Atleta paga via PIX
4. Dinheiro vai **diretamente** para a chave PIX cadastrada pelo clube
5. Clube paga apenas a taxa do gateway de pagamento (~0,99% a 1,5%)
6. **A Bubble não participa do fluxo financeiro**

### O que o clube cadastra

- Chave PIX (CPF, CNPJ, email ou telefone)
- Valor da inscrição por categoria
- O gateway gera o QR Code apontando para a conta do clube

### Custo para o clube

- R$ 0 para usar a plataforma Bubble
- Apenas a taxa do gateway de pagamento na inscrição (paga pelo clube ou repassada ao atleta — decisão do clube)

---

## 2. Gateway de Pagamento — Decisão Técnica

### Opção recomendada: Asaas

- ✅ Suporta PIX com split (necessário futuramente)
- ✅ Gera QR Code dinâmico por cobrança
- ✅ Webhook de confirmação de pagamento
- ✅ Sandbox para testes
- ✅ Taxa PIX: 0,99% por transação
- ✅ Sem mensalidade
- ⚠️ Requer CNPJ para conta completa (PF com limite)

### Alternativa mais simples: AbacatePay

- ✅ PIX simples, sem mensalidade
- ✅ Fácil integração
- ❌ Não suporta split automático (limitação para o futuro)
- Taxa: ~1% por transação

### Decisão MVP

Para o lançamento, implementar com **AbacatePay ou Asaas** gerando QR Code direto para a conta do clube. A Bubble não recebe nenhum valor. Migrar para Asaas quando introduzir comissão.

---

## 3. Posicionamento de Preço — Copy

### ❌ Evitar (cria expectativa legal irreversível)

> "R$ 0 para sempre"
> "Gratuito para sempre"
> "Free forever"

### ✅ Usar (honesto + cria urgência)

> "Grátis durante o lançamento"
> "Grátis para os primeiros 100 clubes"
> "100% gratuito agora"
> "Sem custo fixo — você paga apenas o gateway"

---

## 4. Roadmap de Monetização

### Fase 1 — Agora (0 a 50 clubes)

- Plataforma 100% gratuita para clubes
- PIX direto para conta do clube
- Bubble fora do fluxo financeiro
- Objetivo: validar produto e acumular depoimentos

### Fase 2 — Comissão por inscrição (50+ clubes ativos)

- Bubble passa a cobrar X% por atleta inscrito em torneios com pagamento
- Threshold para ativar: 50 clubes ativos + 3 meses de operação estável
- Valor a definir: R$2 a R$5 por atleta (testar com clubes beta antes de fixar)
- Comunicar com 30 dias de antecedência (conforme termos de uso)

### Fase 3 — Marketplace e Serviços (100+ clubes / 5.000+ atletas)

- **Marketplace de equipamentos** — raquetes, bolinhas, acessórios com comissão
- **Perfil Professor** — agendamento de aulas, Bubble cobra % da aula
- **Torneio entre amigos** — atletas organizam torneios informais, taxa por evento
- **Plano PRO para clubes** — funcionalidades avançadas (relatórios, branding)

---

## 5. Critérios de Go/No-Go para Fase 2

Antes de introduzir qualquer cobrança:

- [ ] ≥ 50 clubes ativos (2+ torneios nos últimos 60 dias)
- [ ] NPS médio dos clubes ≥ 8
- [ ] ≥ 3 meses de operação sem bug crítico
- [ ] Comunicação enviada com 30 dias de antecedência
- [ ] Termos de uso atualizados com novo modelo

---

## 6. Implicações para o Desenvolvimento

### Sprint 3 (gateway PIX)

- Implementar geração de QR Code dinâmico por torneio
- Webhook de confirmação → atualizar status da inscrição
- Clube cadastra chave PIX no perfil
- Dashboard financeiro: inscrições pagas vs pendentes
- **Bubble não aparece no fluxo de pagamento**

### Atualizar na Home (task 2.2 / imediato)

- Trocar "R$ 0 para sempre" → "Grátis no lançamento"
- Adicionar nota de transparência: "Você paga apenas a taxa do gateway quando seus atletas fazem inscrições pagas"

### Atualizar nos Termos de Uso (task 1.T1 / imediato)

- Cláusula 3 (Modelo de Cobrança): refletir que atualmente é gratuito
- Adicionar: "A Bubble se reserva o direito de introduzir cobrança com notificação de 30 dias"
