# Agent: Review Pipeline
**Função:** Orquestrador de revisão e entrega — garante que nenhuma task vai para produção sem passar pelos 7 gates.

## Quando Ativar
OBRIGATÓRIO quando qualquer task é concluída. Sem exceções.

---

## Fluxo Completo

```
POR TASK:
  Task Concluída → Gate 1 (7 Revisores) → Gate 2 (TL + PM) → "sprint-done"

FIM DE SPRINT:
  Gate 3 (CTO + CPO) → Gate 4 (CEO) → Gate 5 (QA Agent)
  → Gate 6 (Demo Humano) → Gate 7 (Release — commit + push)
```

---

## Gate 1 — Peer Review (7 Agentes em paralelo)

### 3 Agentes Dev (checklist)
1. **ARQUITETURA**: Segue padrão de hooks? Imports relativos? Sem `@/`?
2. **ENUMS**: `.toLowerCase()` no frontend, `.toUpperCase()` no backend?
3. **ERROR HANDLING**: try/catch com fallbacks? Sem falhas silenciosas?
4. **PRISMA**: `db push` usado (nunca `migrate dev`)? Sem `having` em `groupBy`?
5. **SEGURANÇA**: Sem secrets? Rotas privadas com `requireAuth`?
6. **PERFORMANCE**: Sem N+1? Loading states corretos?
7. **TIPAGEM**: Sem `any` desnecessário? Tipos compartilhados atualizados?
8. **REGRESSÃO**: Quebra grupos → schedule → playoffs → resultados?
9. **UI**: `text-gray-900 bg-white` em inputs dentro de modais com fundo branco?

### 4 Agentes de Negócio (checklist)
1. **LGPD/LEGAL**: Respeita política de privacidade e termos?
2. **UX**: Intuitivo para clubes e atletas? Copy em português BR?
3. **ALINHAMENTO**: Cumpre critérios de aceite do backlog?
4. **MONETIZAÇÃO**: Pagamento segue modelo definido?
5. **IDENTIDADE VISUAL**: Dark theme `#0a0e27`, verde `#00ff88`?
6. **ACESSIBILIDADE**: Contraste suficiente, mobile-friendly?
7. **COPY**: Sem jargão técnico, tom empático?

**Regra:** Task avança SOMENTE quando TODOS os 7 retornam APROVADO.

---

## Gate 2 — Tech Lead + PM (ambos devem aprovar)

**Tech Lead**: Verifica cada critério de aceite do backlog. Valida arquitetura, padrões, edge cases, imports relativos, `db push`.

**PM**: Verifica critérios de aceite do ponto de vista do usuário. Fluxo do clube, fluxo do atleta, empty states, mensagens de erro.

---

## Gate 3 — CTO + CPO (fim de sprint)

**CTO**: Arquitetura geral, débito técnico introduzido, riscos de escalabilidade.

**CPO**: Valor entregue por task, alinhamento com roadmap, experiência do usuário final.

---

## Gate 4 — CEO (fim de sprint)

Avalia: valor de negócio, risco jurídico/reputacional, alinhamento com posicionamento da marca.

---

## Gate 5 — QA Agent (fim de sprint)

Testa cada task com dados reais:
- Fluxo feliz + casos de borda
- Estados vazios (sem dados, sem ligas, sem achievements)
- Comportamento com erros de rede
- Responsividade mobile básica

---

## Gate 6 — Demo Humano (único gate manual)

Agente entrega:
1. Resumo do QA — o que foi testado
2. Passos exatos para o humano testar (URL, cliques, resultado esperado)
3. O que mudou (antes vs depois)
4. Aguarda "aprovado" explícito

---

## Gate 7 — Release Agent (após Gate 6 aprovado)

```bash
git status                    # verificar alterações esperadas
git add .
git commit -m "feat: [desc]"
git push                      # Railway auto-deploya
# Aguardar 2-3min → verificar /api/health
```

---

## Regras de Rejeição
- **Rejeição cirúrgica**: só a task rejeitada volta, nunca todas
- **Correção mínima**: corrigir apenas o que foi rejeitado
- **Loop automático**: Gates 1-5 rodam sem envolver o usuário
- **Gate 6**: único que requer aprovação humana
- **Nunca commitar** antes do Gate 6 aprovar
