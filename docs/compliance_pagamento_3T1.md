# BubblePadel — Compliance de Pagamento + Política de Reembolso
## Task 3.T1
**Data:** Março 2026 | **Responsável:** Rafael Couto

---

## 1. Modelo de Pagamento Definido (ref. 2.T1)

- Atleta paga via PIX dinâmico gerado por cobrança
- Dinheiro vai **diretamente** para a conta do clube
- Bubble não intermedia o fluxo financeiro (por enquanto)
- Clube cadastra chave PIX no perfil
- Taxa do gateway (~1%) é absorvida pelo clube ou repassada ao atleta — decisão do clube

---

## 2. Política de Reembolso

### Cancelamento pelo Atleta

| Prazo | Reembolso |
|---|---|
| Até 48h antes do torneio | Reembolso integral (clube processa manualmente via PIX) |
| Menos de 48h antes | Sem reembolso, salvo decisão do clube |
| Torneio cancelado pelo clube | Reembolso integral obrigatório |

### Responsabilidade pelo Reembolso
- **Quem reembolsa:** o Clube — pois o dinheiro foi direto para a conta do clube
- **Como:** transferência PIX manual pelo clube para o atleta
- **Prazo:** até 5 dias úteis após solicitação
- **A Bubble** não processa reembolsos nesta fase (PIX direto ao clube)

### Cancelamento do Torneio pelo Clube
- Clube cancela → obrigação de reembolsar **todos** os atletas pagantes
- Bubble envia email automático avisando os atletas (task 3.5)
- Clube tem prazo de 7 dias para processar todos os reembolsos

---

## 3. CDC — Direito de Arrependimento (Art. 49)

O CDC Art. 49 garante direito de arrependimento em 7 dias para compras online. Aplicação ao nosso contexto:

**Posição:** inscrição em torneio esportivo = serviço com data definida. O direito de arrependimento de 7 dias **pode não se aplicar** quando o serviço é prestado dentro do prazo de 7 dias (ex: torneio é amanhã). Consultar advogado para confirmação.

**Posição conservadora (recomendada para o MVP):** aceitar cancelamento com reembolso integral se solicitado em até 48h após a inscrição E com mais de 48h de antecedência ao torneio. Isso cobre o espírito do Art. 49 sem comprometer torneios de curto prazo.

---

## 4. LGPD — Dados de Pagamento

### Dados coletados no processo de pagamento:
- Status do pagamento (PAGO/PENDENTE/EXPIRADO)
- ID da cobrança no gateway
- Data e horário do pagamento
- Valor pago

### O que NÃO coletamos:
- Dados bancários do atleta
- Chave PIX do atleta
- CPF/CNPJ do atleta (o gateway coleta para compliance próprio)

### Base legal (LGPD Art. 7º, V): execução de contrato (inscrição no torneio)
### Retenção: 5 anos conforme CTN Art. 195 (registros fiscais)

---

## 5. Regras de Comunicação (Anti-spam / CDC Art. 42)

Para emails de cobrança/lembrete de pagamento:
- Máximo 2 emails por cobrança (gerado + lembrete único)
- Tom: informativo, nunca ameaçador
- Link de suporte em todo email de pagamento
- Horário de envio: 8h-20h

---

## 6. Requisitos de Implementação (para dev — task 3.1)

### Clube deve cadastrar:
- Chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)
- Valor da inscrição por categoria (pode ser 0 para torneios gratuitos)
- Política de cancelamento personalizada (texto livre, opcional)

### Sistema deve:
- Gerar QR Code único por inscrição (não reusar o mesmo QR)
- Expirar QR Code após 30 minutos (configurável)
- Registrar: paymentStatus, externalId do gateway, paidAt
- Nunca bloquear inscrição por falha no pagamento (registrar PENDING e seguir)

### Fluxo de estados do pagamento:
```
PENDING → PAID (webhook confirmação)
PENDING → EXPIRED (timeout 30min)
PAID → REFUNDED (manual pelo clube)
```

---

## 7. Termos de Uso — Atualização Necessária

A Cláusula 3 dos Termos (Modelo de Cobrança) precisa ser atualizada para refletir:
- PIX vai direto para o clube
- Bubble não é responsável por reembolsos
- Prazo de reembolso pelo clube: 5 dias úteis
- Política de cancelamento: 48h antes para reembolso integral

**Ação:** atualizar `TermsPage.tsx` com novo texto da Cláusula 3 após Sprint 3.
