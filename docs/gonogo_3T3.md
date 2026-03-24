# BubblePadel — Critérios Go/No-Go: Beta → Lançamento Público
## Task 3.T3
**Data:** Março 2026 | **Decisão prevista:** Final da Sprint 3

---

## O que é o Go/No-Go?

É a reunião formal onde decidimos se o produto está pronto para marketing ativo e cadastro self-service de clubes. Antes desta decisão, só entramos em contato com clubes manualmente (outreach direto).

---

## Critérios — todos os 4 devem ser atendidos

### ✅ Critério 1 — NPS dos Organizadores ≥ 7
- **Como medir:** média das respostas do formulário D+7 (task 2.T4)
- **Mínimo de respostas:** 3 clubes responderam
- **O que conta:** pergunta "De 0 a 10, o quanto recomendaria o Bubble?"
- **Responsável por coletar:** Rafael

### ✅ Critério 2 — 3+ Torneios Completos Sem Bug Crítico
- **O que é "torneio completo":** criado → inscrições → grupos → playoffs → resultados publicados
- **O que é "bug crítico":** perda de dados, erro de pagamento, crash que impede o torneio de acontecer
- **Como verificar:** logs do Railway + relato direto do clube
- **Responsável:** Rafael (acompanhar com os clubes alpha)

### ✅ Critério 3 — 1+ Pagamento PIX Real Processado com Sucesso
- **O que conta:** atleta pagou via PIX, dinheiro chegou na conta do clube, status atualizou para PAGO na plataforma
- **Não conta:** simulação em sandbox, pagamento sem webhook funcionando
- **Como verificar:** dashboard financeiro do clube + extrato do clube

### ✅ Critério 4 — Zero Bugs Críticos nas Últimas 2 Semanas
- **Janela:** 14 dias antes da reunião de Go/No-Go
- **O que é crítico:** qualquer erro que impediu um usuário de concluir uma ação principal
- **Fonte:** Sentry + relatos diretos dos clubes

---

## Critérios Desejáveis (não bloqueadores)

- [ ] Pelo menos 2 depoimentos de clubes aprovados para landing page
- [ ] UptimeRobot mostrando ≥ 99% uptime no último mês
- [ ] Footer e termos atualizados com política de reembolso real

---

## Data da Reunião de Go/No-Go

**Prevista para:** fim da Sprint 3 (estimativa: Abril/Maio 2026)

**Participantes:** Rafael Couto + co-fundador

**Duração:** 30 minutos

**Agenda:**
1. Verificar cada critério com dados reais (15 min)
2. Decisão: GO ou mais 1 sprint de ajustes (10 min)
3. Se GO: definir data de início do marketing ativo (5 min)

---

## O que acontece depois do GO?

- Ativar cadastro self-service no site (qualquer clube pode criar conta)
- Lançar landing page com depoimentos reais
- Começar outreach ativo para clubes (Instagram, WhatsApp, indicações)
- Sprint 4: área do atleta, ranking, PDF de resultados, SEO

## O que acontece se for NO-GO?

- Identificar qual critério não foi atendido
- Criar task emergencial para resolver
- Nova reunião em 2 semanas
- Não iniciar marketing ativo até todos os critérios serem atendidos

---

## Checklist para a Reunião

```
CRITÉRIOS OBRIGATÓRIOS:
[ ] NPS ≥ 7 (N = ___ respostas, média = ___)
[ ] Torneios completos: ___ (precisa ≥ 3)
[ ] Pagamento PIX real: SIM / NÃO
[ ] Bugs críticos últimas 2 semanas: ___ (precisa = 0)

CRITÉRIOS DESEJÁVEIS:
[ ] Depoimentos aprovados: ___ (meta: 2)
[ ] Uptime último mês: ___%
[ ] Termos atualizados: SIM / NÃO

DECISÃO: GO ⬜  /  NO-GO ⬜

Se GO — data de início do marketing: ___/___/2026
Se NO-GO — motivo: _______________
           Próxima reunião: ___/___/2026
```
