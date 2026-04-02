# Infraestrutura de Agentes — Setup MCP

## Estrutura de Arquivos

```
/agents/
  dev-pipeline.md       ← Tech Lead (gate 0-3, regras absolutas, hooks, serviços)
  review-pipeline.md    ← Orquestrador de revisão (7 gates, release)
  ui-specialist.md      ← Head of Design (design gate, paleta, padrões)
  specialists.md        ← Gamification + Legal + Monetization + Product + Copy
  mcp-setup.md          ← Este arquivo
```

Esta estrutura substitui `/skills/user/bubble-padel-*/SKILL.md`.
Cada `.md` é o agente completo — sem pastas intermediárias.

---

## MCP GitHub — Setup (maior impacto)

**Por que é o mais importante:** elimina o fluxo manual de copiar/colar arquivos e commitar. Claude empurra diretamente para o repositório.

### Como conectar no Claude.ai
1. Acessar **claude.ai → Settings → Integrations**
2. Clicar em **"Connect GitHub"**
3. Autorizar acesso ao repositório `couto-rafael/bubble-padel`
4. Selecionar: acesso apenas a esse repositório (não todos)

### O que muda no fluxo de trabalho
| Antes | Depois |
|---|---|
| Claude gera arquivo → você copia → cola no projeto → commit manual | Claude cria/edita arquivo diretamente no repo → commit automático |
| Você gerencia qual versão está no output | Claude lê o arquivo atual do repo antes de editar |
| Risco de copiar versão errada | Sempre parte do estado real do código |

### Regras de uso do MCP GitHub
- Claude só commita após Gate 6 (aprovação humana) — nunca antes
- Branch padrão: `main` (Railway auto-deploya)
- Commit sempre da forma: `git commit -m "[tipo]: [descrição curta]"`
- Nunca forçar push (`--force`) sem confirmação explícita
- `npx prisma db push` ainda precisa ser rodado manualmente no backend (Railway não roda automaticamente)

---

## MCP Figma — Setup (útil para Sprint 6+)

**Por que é útil:** UI Specialist pode ler designs diretamente do Figma antes de gerar código — sem precisar de screenshots.

### Como conectar
1. Acessar **claude.ai → Settings → Integrations**
2. Clicar em **"Connect Figma"**
3. Autorizar acesso ao arquivo de design do Bubble Padel
4. URL do arquivo Figma: [adicionar quando disponível]

### Como usar
No prompt: "Leia o componente X do Figma e implemente em React"
Claude: chama o MCP Figma, lê a estrutura, gera o código fiel ao design.

**Pré-requisito:** ter um arquivo Figma do Bubble Padel (criar durante Sprint 6 — Design System).

---

## MCP Railway — Avaliação (futuro)

**Por que avaliar:** monitorar deploys e logs sem sair do chat.

**Status:** Railway ainda não tem MCP oficial publicado (Abril 2026).
Alternativa atual: verificar `/api/health` manualmente após cada push.

Revisar disponibilidade no início da Sprint 7.

---

## Checklist de Setup Sprint 6

- [ ] Conectar MCP GitHub no claude.ai
- [ ] Testar: Claude lê arquivo atual do repo
- [ ] Testar: Claude commita uma mudança pequena (ex: comentário no README)
- [ ] Confirmar que Railway deploya automaticamente após commit do Claude
- [ ] Criar arquivo Figma base para o Design System
- [ ] Conectar MCP Figma (se arquivo Figma disponível)
- [ ] Mover SKILLs de `/skills/user/` para `/agents/` (substituição)
