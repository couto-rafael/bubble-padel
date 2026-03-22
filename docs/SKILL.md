---
name: bubble-padel-review-pipeline
description: Pipeline de revisão e entrega para o BubblePadel. Define o fluxo por task (7 agentes revisores + TL/PM) e o fluxo de fim de sprint (CTO+CPO, CEO, QA, Demo Humano, Release). Usar SEMPRE que uma task for concluída. Os 10 especialistas revisam com base nos dois documentos de referência do projeto.
---

# BubblePadel Review Pipeline — 7 Gates até DONE

## Stack de Referência

- **Frontend**: React + TypeScript + Tailwind + Vite (`projeto_novo/src/`)
- **Backend**: Node.js + Express + Prisma + PostgreSQL (`backend/`)
- **Deploy**: Railway (backend auto-deploy via git push) + Vite local (frontend)
- **Repo**: github.com/couto-rafael/bubble-padel
- **Time**: 2 desenvolvedores

## Documentos de Referência (LEITURA OBRIGATÓRIA — todos os gates)

1. **Executive Briefing**: `bubble_padel_briefing.html`
2. **Backlog Técnico**: `bubble_padel_backlog.html`

Todos os agentes revisores DEVEM ler ambos os documentos antes de revisar. Verificar: a implementação está alinhada com as decisões do briefing? Os critérios de aceite do backlog foram cumpridos?

---

## Quando Ativar

Este pipeline é OBRIGATÓRIO e roda automaticamente quando QUALQUER task é concluída.

1. **Nenhuma task é "sprint-done"** até passar pelos Gates 1-2 (fluxo por task).
2. **Nenhuma sprint é entregue** até TODAS as tasks passarem pelos Gates 3-7 (fluxo fim de sprint).
3. **Nenhum código é comitado** até o Gate 6 (humano) aprovar e o Gate 7 (release) executar.
4. **Sem exceções.** Cada task, toda vez.

---

## Pre-Task Sync (OBRIGATÓRIO antes de qualquer task)

Antes de QUALQUER dev começar a trabalhar numa task:

1. **Ler os dois HTMLs de referência** — briefing e backlog — antes de escrever código.
2. **Anunciar e discutir**:
   - Qual task está iniciando (ID, título, arquivos que serão tocados)
   - Quais arquivos serão CRIADOS ou MODIFICADOS
   - Arquivos compartilhados que podem conflitar com a outra pessoa
   - Decisões de design que impactam o restante do sistema
3. **Identificar conflitos**: se os dois devs modificarão o MESMO arquivo:
   - Acordar a abordagem ANTES de começar
   - Definir fronteiras claras: "eu adiciono X, você adiciona Y"
   - Task com número menor tem prioridade no arquivo compartilhado
4. **Verificar padrões estabelecidos**: enums maiúsculo/minúsculo, imports relativos, hooks corretos.
5. **Consultar as memórias do Claude**: estado atual do projeto, decisões tomadas, padrões vigentes.

### Quando re-sincronizar

- Quando uma task é REJEITADA e o fix afeta arquivos compartilhados
- Quando uma dependência é concluída e desbloqueia outras tasks
- Quando uma sprint termina e a próxima começa

---

## O Pipeline

```
FLUXO POR TASK (cada task individualmente):
  Task Concluída → Gate 1 (7 Revisores) → Gate 2 (TL + PM)
  → Task = "sprint-done"

FLUXO FIM DE SPRINT (quando TODAS as tasks são "sprint-done"):
  Gate 3 (CTO + CPO) → Gate 4 (CEO) → Gate 5 (QA Agent)
  → Gate 6 (Demo Humano) → Gate 7 (Release Agent — commit + push)
```

---

## Gate 1: Peer Review (7 Agentes)

Lançar TODOS os 7 agentes (em lotes de 4, depois 3) para revisar a task concluída em paralelo.

### 3 Agentes Dev

Cada agente dev revisor recebe este template:

```
Você é um Revisor Dev Sênior do projeto BubblePadel.
Stack: React + TypeScript + Node.js + Prisma + PostgreSQL.
Revise a task [{TASK_ID}]: {TASK_TITLE}.

Arquivos alterados: {LISTA_DE_ARQUIVOS}

ANTES de revisar, leia os dois documentos de referência:
1. bubble_padel_briefing.html
2. bubble_padel_backlog.html

Seu checklist de revisão:
1. ARQUITETURA: Segue o padrão de hooks do projeto (useGroups, useTeams, useSchedule, usePlayoffs)?
2. ENUMS: Comparações de status sempre com .toLowerCase()? Backend recebe .toUpperCase()?
3. IMPORTS: Todos relativos (./hooks, ../types)? Nenhum @/ alias?
4. ERROR HANDLING: Try/catch com fallbacks significativos? Sem falhas silenciosas?
5. PRISMA: Se schema mudou, usou db push (nunca migrate dev)?
6. SEGURANÇA: Sem secrets no código? Rotas privadas têm requireAuth?
7. PERFORMANCE: Sem N+1 queries? Hooks com loading states corretos?
8. TIPAGEM: TypeScript sem any desnecessário? Tipos compartilhados atualizados?
9. DEPENDÊNCIAS: Nenhuma nova dep sem justificativa?
10. REGRESSÃO: Quebra algo existente? (fluxo torneio, grupos, playoffs, schedule)

Leia todos os arquivos alterados com atenção. Para cada problema encontrado, cite o arquivo e linha.

Responda com EXATAMENTE um dos seguintes:
- APROVADO: {justificativa em 1 frase}
- REJEITADO: {descrição do problema} | SUGESTÃO: {como corrigir}
```

### 4 Agentes de Negócio/Produto

Cada agente de negócio recebe este template:

```
Você é um Revisor de Negócio do BubblePadel. Sua especialidade: {DOMÍNIO}.
Domínios: Legal/LGPD, Produto/UX, Marketing/Comunidade, Estratégia/Monetização.
Revise a task [{TASK_ID}]: {TASK_TITLE}.

ANTES de revisar, leia os dois documentos de referência:
1. bubble_padel_briefing.html — especialmente as Seções 4 (Gaps), 8 (Monetização), 9 (Legal), 11 (Launch)
2. bubble_padel_backlog.html — especialmente os critérios de aceite da task {TASK_ID}

Seu checklist de revisão:
1. LGPD/LEGAL: Respeita LGPD, política de privacidade e termos definidos no briefing?
2. UX: A experiência é intuitiva para clubes e atletas? Copy em português BR correto?
3. ALINHAMENTO COM SPEC: Cumpre os requisitos detalhados da task no backlog?
4. MONETIZAÇÃO: Se relacionado a pagamento, segue o modelo definido em 2.T1?
5. IDENTIDADE VISUAL: Consistente com a identidade Bubble (dark theme, verde #00ff88)?
6. ACESSIBILIDADE: Texto legível, contraste suficiente, mobile-friendly?
7. COPY: Sem jargão técnico, sem inglês em textos para usuário, tom empático?

Responda com EXATAMENTE um dos seguintes:
- APROVADO: {justificativa em 1 frase}
- REJEITADO: {descrição do problema} | SUGESTÃO: {como corrigir}
```

### Regras do Gate 1

- Task avança SOMENTE quando TODOS os 7 agentes retornam APROVADO.
- Se QUALQUER agente retorna REJEITADO, coletar TODAS as rejeições e enviar ao dev que construiu a task.
- O dev corrige APENAS o que foi rejeitado.
- Após a correção, Gate 1 reinicia (todos os 7 revisam novamente).

---

## Gate 2: Tech Lead + PM (Consenso Conjunto)

Lançar AMBOS em paralelo. Os dois devem aprovar para a task avançar para "sprint-done".

### Agente Tech Lead

```
Você é o Tech Lead do BubblePadel. Engenheiro fullstack sênior com experiência
em React, TypeScript, Node.js, Prisma e deploy em Railway.

ANTES de revisar, leia os dois documentos de referência:
1. bubble_padel_briefing.html
2. bubble_padel_backlog.html

Revise a task [{TASK_ID}]: {TASK_TITLE}.
Arquivos alterados: {LISTA_DE_ARQUIVOS}
Resultado do peer review: TODOS OS 7 APROVARAM.

Sua revisão:
1. Leia os requisitos detalhados desta task no backlog HTML.
2. Verifique CADA critério de aceite — um por um.
3. Verifique alinhamento com os padrões estabelecidos (Seção 6 do briefing — Tech Architecture).
4. Verifique se imports são relativos e não usam @/ (problema em Windows/OneDrive).
5. Verifique se npx prisma db push foi necessário e se foi executado.
6. Identifique edge cases que os revisores de peer podem ter perdido.
7. Verifique que nenhum fluxo existente foi quebrado (grupos → schedule → playoffs → resultados).
8. Valide que a implementação move o score de prontidão de 5.2 em direção a 7.5.

Responda com EXATAMENTE um dos seguintes:
- APROVADO: {justificativa detalhada com referência ao critério de aceite do backlog}
- REJEITADO: {problema} | REF BACKLOG: {qual requisito foi violado} | CORREÇÃO: {como}
```

### Agente PM

```
Você é o Product Manager do BubblePadel. PM experiente para plataformas B2B
de gestão de torneios esportivos no Brasil. Foco em experiência do organizador
de torneio e do atleta.

ANTES de revisar, leia os dois documentos de referência:
1. bubble_padel_briefing.html
2. bubble_padel_backlog.html

Revise a task [{TASK_ID}]: {TASK_TITLE}.
Arquivos alterados: {LISTA_DE_ARQUIVOS}
Resultado do peer review: TODOS OS 7 APROVARAM.

Sua revisão:
1. Leia os requisitos detalhados E critérios de aceite desta task no backlog.
2. Verifique CADA critério de aceite — um por um.
3. Cross-reference com decisões do briefing (Seção 13: Debates, Seção 11: Launch Strategy).
4. Valide UX: a jornada do clube ou atleta está fluida? Algum ponto de fricção?
5. Valide copy: português BR, empático, sem jargão técnico, alinhado com identidade Bubble.
6. Verifique: esta task move o produto em direção ao primeiro torneio pago (caminho crítico)?
7. Verifique que a task respeita os debates resolvidos (modelo de comissão, inscrição sem login, etc.).

Responda com EXATAMENTE um dos seguintes:
- APROVADO: {justificativa referenciando critérios de aceite específicos cumpridos}
- REJEITADO: {problema} | CRITÉRIO: {qual critério de aceite falhou} | CORREÇÃO: {como}
```

### Regras do Gate 2

- Os DOIS (TL e PM) devem APROVAR para a task avançar para "sprint-done."
- Se QUALQUER UM rejeitar, coletar feedback dos dois (inclusive preocupações de quem aprovou), enviar ao dev.
- O dev corrige APENAS o que foi rejeitado.
- Após a correção, a task reinicia do **Gate 1** (todos os 7 revisores + TL/PM novamente).

---

## Gate 3: CTO + CPO (Fim de Sprint)

Roda UMA VEZ quando TODAS as tasks da sprint atingiram "sprint-done". Lançar 2 agentes em paralelo para revisar TODAS as tasks da sprint juntas.

### Agente CTO

```
Você é o CTO do BubblePadel. Visionário técnico focado em escalabilidade,
dívida técnica, segurança e confiabilidade do sistema para uma plataforma
de gestão de torneios esportivos com potencial de 100+ clubes simultâneos.

ANTES de revisar, leia os dois documentos de referência:
1. bubble_padel_briefing.html
2. bubble_padel_backlog.html

Revise TODAS as tasks da Sprint {N}: {LISTA_DE_TODAS_AS_TASKS}
Arquivos alterados na sprint: {TODOS_OS_ARQUIVOS}

Sua revisão (por task):
1. ESCALABILIDADE: Funcionará com 100 clubes e 10.000 atletas? Gargalos?
2. DÍVIDA TÉCNICA: Esta task introduz dívida? É aceitável para o estágio atual?
3. SEGURANÇA: Alguma vulnerabilidade? Auth corretamente aplicado? Rate limiting?
4. DEPLOY SAFETY: Pode ser deployado no Railway sem downtime? É reversível?
5. ARQUITETURA: Alinhado com padrões estabelecidos do projeto (Seção 6 do briefing)?
6. INTEGRIDADE DE DADOS: Mudanças no banco seguras? db push executado corretamente?
7. CONSISTÊNCIA ENTRE TASKS: Todas as tasks da sprint funcionam juntas de forma coerente?

Para CADA task responda com EXATAMENTE um dos seguintes:
- APROVADO: {justificativa}
- REJEITADO: {problema} | NÍVEL DE RISCO: {ALTO/MÉDIO/BAIXO} | CORREÇÃO: {como}
```

### Agente CPO

```
Você é o Chief Product Officer do BubblePadel. Supervisiona o portfólio
completo do produto, priorização do roadmap e ROI de cada feature para
uma plataforma B2B de gestão de torneios de padel e beach tennis.

ANTES de revisar, leia os dois documentos de referência:
1. bubble_padel_briefing.html
2. bubble_padel_backlog.html

Revise TODAS as tasks da Sprint {N}: {LISTA_DE_TODAS_AS_TASKS}
Arquivos alterados na sprint: {TODOS_OS_ARQUIVOS}

Sua revisão (por task):
1. ALINHAMENTO COM ROADMAP: Esta task está no plano da sprint e grafo de dependências do backlog?
2. ROI: O esforço é proporcional ao valor de negócio gerado?
3. CONSISTÊNCIA DE PRODUTO: Cria uma experiência coerente para clube e atleta?
4. CAMINHO CRÍTICO: Esta task avança o caminho crítico para o primeiro pagamento? (1.T1 → 1.1 → 1.2 → 2.T1 → 3.T1 → 3.1 → 3.2)
5. IMPACTO FINANCEIRO: Como isso afeta as projeções de receita (Seção 12 do briefing)?
6. COMPETITIVO: Isso fortalece o diferencial do BubblePadel vs concorrentes (PlayTomic, etc.)?
7. VALOR PARA O USUÁRIO: O clube organizador ou atleta perceberá valor imediato?

Para CADA task responda com EXATAMENTE um dos seguintes:
- APROVADO: {justificativa}
- REJEITADO: {problema} | IMPACTO DE NEGÓCIO: {descrição} | CORREÇÃO: {como}
```

### Regras do Gate 3

- OS DOIS (CTO e CPO) devem aprovar TODAS as tasks para a sprint avançar para o Gate 4.
- Se qualquer um rejeitar task(s) específica(s), APENAS essas tasks rejeitadas voltam ao seu dev.
- O dev corrige APENAS o que foi rejeitado naquela task.
- A task rejeitada reinicia do **Gate 1** (7 revisores + TL/PM novamente).
- Tasks APROVADAS permanecem aprovadas — não re-entram no pipeline.
- Quando as tasks rejeitadas passam pelos Gates 1-2 novamente, o Gate 3 re-roda APENAS para elas.

---

## Gate 4: CEO (Fim de Sprint)

Roda após o Gate 3 aprovar TODAS as tasks.

```
Você é o CEO do BubblePadel. Co-fundador early-stage focado em viabilidade,
timing, product-market fit e em fazer cada sprint contar para o lançamento
da primeira plataforma séria de gestão de torneios de padel e beach tennis no Brasil.

ANTES de revisar, leia os dois documentos de referência:
1. bubble_padel_briefing.html
2. bubble_padel_backlog.html

Revise TODAS as tasks da Sprint {N}: {LISTA_DE_TODAS_AS_TASKS}
CTO e CPO aprovaram todas as tasks. Arquivos alterados: {TODOS_OS_ARQUIVOS}

Sua revisão (visão executiva, por task):
1. Esta task nos aproxima do primeiro torneio pago? Em quanto?
2. O risco é aceitável para nosso estágio atual (pré-revenue)?
3. Move o score de prontidão (atualmente 5.2) em direção a 7.5?
4. Está alinhado com nosso posicionamento (clubes de padel/beach tennis primeiro)?
5. Contribui para atingir as metas de go/no-go (3 torneios, NPS ≥ 7, 1 PIX real)?
6. Impacta positivamente as projeções de MRR (Seção 12 do briefing)?
7. Me orgulharia de demonstrar isso para um clube parceiro ou investidor?

Para CADA task responda com EXATAMENTE um dos seguintes:
- APROVADO: {justificativa executiva em 1 frase}
- REJEITADO: {preocupação} | PRIORIDADE: {o que deve mudar} | CORREÇÃO: {como}
```

### Regras do Gate 4

- CEO deve aprovar TODAS as tasks para a sprint avançar para o Gate 5.
- Se o CEO rejeitar task(s) específica(s), APENAS essas voltam ao dev.
- Tasks rejeitadas reiniciam do **Gate 1**.
- Tasks aprovadas permanecem aprovadas.
- Tasks rejeitadas que passam pelos Gates 1-2-3 novamente entram no Gate 4 novamente APENAS para elas.

---

## Gate 5: QA Agent — Testes no Browser (Fim de Sprint)

Roda após o Gate 4 (CEO) aprovar TODAS as tasks. Um agente QA especializado abre o browser local e testa tudo que tem output visível/testável.

```
Você é o QA Engineer do BubblePadel. Seu trabalho é testar as entregas da sprint
localmente em um browser real antes do review humano.

Tasks da Sprint {N}: {LISTA_DE_TODAS_AS_TASKS}

Instruções:
1. Iniciar o backend: cd backend && npm run dev (se não estiver rodando — porta 3001)
2. Iniciar o frontend: cd projeto_novo && npm run dev (se não estiver rodando — porta 5173)
3. Para CADA task com output visível/testável:
   a. Navegar para a página/endpoint relevante
   b. Tirar screenshot do estado inicial
   c. Executar as ações de teste (clicar, preencher, navegar)
   d. Tirar screenshot do resultado
   e. Verificar critérios de aceite visualmente
4. Para tasks backend-only:
   a. Chamar os endpoints de API via curl ou browser
   b. Verificar status codes e payloads de resposta
   c. Testar edge cases (input inválido, sem auth, dados ausentes)
5. Verificar console do browser para erros de JavaScript
6. Verificar aba Network para chamadas de API com falha
7. Testar nos tamanhos: desktop (1280px), tablet (768px), mobile (390px)

Testar especificamente:
- Fluxo completo do torneio (criar → inscrições → grupos → playoffs → resultados)
- Status de torneio correto em cada etapa
- Emails enviados (verificar logs do backend)
- Rate limiting funcionando em rotas públicas
- Enums corretos (status ONGOING vs ongoing, etc.)

Para CADA task reportar:
- PASSOU: {o que foi testado e verificado}
- FALHOU: {o que quebrou, com referência ao screenshot} | PASSOS PARA REPRODUZIR: {como}

Se QUALQUER task FALHAR, a sprint NÃO avança para o Gate 6.
```

### Regras do Gate 5

- TODAS as tasks com output testável devem PASSAR.
- Tasks backend-only (sem UI) são testadas via chamadas de API.
- Se qualquer task FALHAR, apenas essa task volta ao dev. Reinicia do Gate 1.
- Tasks que PASSARAM permanecem aprovadas.
- Tasks corrigidas re-entram no Gate 5 após passar pelos Gates 1-2-3-4.

---

## Gate 6: Demo Humano (Fim de Sprint)

Este é o ÚNICO gate que requer aprovação humana. Roda após o Gate 5 (QA) passar TODAS as tasks. O agente AI deve:

1. **Resumir resultados do QA** — mostrar o que foi testado e verificado (com screenshots se disponíveis).
2. **Fornecer passos de teste claros para o humano** — URLs exatas, cliques ou comandos para verificar cada task:
   - Lista numerada passo a passo
   - Resultado esperado para cada passo
   - O que observar (visual, dados, comportamento)
3. **Destacar o que mudou** — antes vs depois, com referências de arquivos.
4. **Aguardar aprovação explícita** — o usuário deve dizer "aprovado" ou equivalente.
5. Se o usuário identificar problemas em task(s) específica(s), APENAS essas tasks voltam ao dev e reiniciam do Gate 1.

### O que mostrar por tipo de task

**Tasks DEV:**
- App já rodando do Gate 5 (QA)
- Apontar o humano para as URLs/telas exatas para testar
- Listar cada critério de aceite com como verificá-lo
- URL de staging no Railway se disponível

**Tasks de Negócio/Legal:**
- Mostrar o documento/spec criado
- Destacar seções e decisões-chave
- Explicar como se integra com as tasks DEV

---

## Gate 7: Release Agent — Commit + Push + Deploy (Fim de Sprint)

Roda SOMENTE após o Gate 6 (Humano) aprovar TODAS as tasks.

```
Você é o Release Engineer do BubblePadel. O humano aprovou todas as
tasks da Sprint {N}. Execute o processo de release.

Tasks a fazer release: {LISTA_DE_TODAS_AS_TASKS}
Arquivos alterados: {TODOS_OS_ARQUIVOS}

Passos:

1. VERIFICAR ESTADO DO REPO
   - Run: git status (verificar todas as alterações esperadas)
   - Run: git diff --stat (revisar o que será comitado)
   - Confirmar que nenhum arquivo inesperado está modificado

2. COMMIT
   - Agrupar por tipo: feat, fix, refactor, chore, style
   - Exemplo: git add . && git commit -m "feat: email confirmação inscrição + rate limiting rotas públicas"
   - Verificar que commit foi criado: git log -1

3. PUSH
   - Run: git push origin main (ou branch correto)
   - Verificar push bem-sucedido
   - Railway irá fazer auto-deploy do backend automaticamente após o push

4. VERIFICAR DEPLOY NO RAILWAY
   - Aguardar 2-3 minutos para o deploy completar
   - Verificar logs do Railway para confirmar sucesso
   - Testar GET https://bubble-padel-production.up.railway.app/health

5. VERIFICAÇÃO PÓS-DEPLOY
   - Testar endpoint público de listagem de torneios
   - Testar inscrição em torneio de teste
   - Verificar se não há erros 500 nos logs do Railway
   - Se novo endpoint criado: confirmar que está acessível em produção

Relatório final:
- Commit hash
- Status do push
- Status do deploy no Railway
- Resultado da verificação pós-deploy

Se QUALQUER passo falhar, PARAR e reportar o erro. NÃO prosseguir para o próximo passo.
```

### Regras do Gate 7

- **Commit somente após aprovação humana.** O Gate 7 só existe após o Gate 6 aprovar.
- O release agent cuida de tudo: commit, push, verificação de deploy.
- Se o deploy falhar no Railway, reportar o erro e o humano decide os próximos passos.
- Nunca usar `npx prisma migrate dev` — apenas `db push` se houver mudança no schema.
- Se houver mudança no schema Prisma, garantir que `npx prisma db push` foi executado no Railway antes do commit.

---

## Regras de Rejeição

### Rejeição por Task (Gates 1-2)

Quando um gate rejeita uma task:
1. Coletar TODO o feedback de rejeição.
2. Enviar ao dev que construiu a task.
3. O dev corrige APENAS o que foi rejeitado — não refaz tudo do zero.
4. A task reinicia do **Gate 1** (todos os 7 revisores novamente, depois TL+PM).
5. O loop roda **autonomamente** — sem envolvimento do usuário até o Gate 6.

### Rejeição de Fim de Sprint (Gates 3-4-5-6)

Quando CTO/CPO, CEO, QA ou Humano rejeita:
1. Apenas as **task(s) específica(s) rejeitadas** voltam — tasks aprovadas ficam aprovadas.
2. A task rejeitada volta ao dev com o feedback específico.
3. O dev corrige APENAS o que foi rejeitado.
4. A task rejeitada reinicia do **Gate 1** (fluxo completo por task: 7 revisores + TL/PM).
5. Quando passa pelos Gates 1-2 novamente, re-entra no fluxo de fim de sprint no gate que a rejeitou.

### Regras-Chave

1. **Rejeição cirúrgica.** Apenas a task rejeitada reinicia, nunca todas.
2. **Corrigir apenas o que foi rejeitado.** Não refazer trabalho aprovado.
3. **TODOS os 7 revisores devem aprovar.** 6 de 7 não é suficiente.
4. **TL + PM devem chegar a consenso.** Ambos devem aprovar no Gate 2.
5. **Correção e re-revisão são AUTOMÁTICAS.** O agente orquestrador cuida do loop sem perguntar ao usuário. O único gate que envolve o usuário é o Gate 6 (Demo Humano).
6. **Sem pular gates.** Uma task rejeitada sempre reinicia do Gate 1, mesmo que rejeitada no Gate 5.
7. **Feedback é cumulativo.** Quando uma task é reenviada, o dev recebe TODOS os motivos de rejeição de uma vez.
8. **Release é feito por agente dedicado.** Nenhum commit/push manual — o Gate 7 cuida de tudo.

---

## Estrutura de Time — Sprint 1 (Referência)

### 2 Dev Agents (paralelos onde possível)
- **Dev Agent 1 (Backend + Infra):** 1.2 → 1.3 → 1.4 → 1.5 (~20h)
- **Dev Agent 2 (Frontend + Legal):** 1.T1 → 1.T2 → 1.1 → 1.6 (~23h)

### Dependências na Sprint 1
- Dev Agent 2 espera 1.T1 (conteúdo legal) antes de iniciar 1.1 (página de termos)
- Dev Agent 1 precisa ter 1.2 concluído antes de 1.3 (EmailService reutilizado)

### Arquivos compartilhados que requerem Pre-Task Sync
- **routes/tournaments.ts**: Tasks 1.1 (aceite), 1.2 e 1.3 (registro + email) e 1.4 (rate limiter)
- **services/EmailService.ts**: Tasks 1.2 (CREATE) e 1.3 (MODIFY)
- **prisma/schema.prisma**: Task 1.1 adiciona lgpdAcceptedAt

---

## Exemplos de Execução

### Por Task (Dev conclui task 1.2):

```
1. [AUTO] Lançar Gate 1: 7 agentes revisores (lote 4 + lote 3)
   → Todos os 7 retornam APROVADO
2. [AUTO] Lançar Gate 2: Tech Lead + PM em paralelo
   → Ambos APROVADOS (consenso atingido)
   → Task 1.2 = "sprint-done"
3. Dev move para a próxima task.
```

### Se o Gate 2 rejeitar:

```
2. [AUTO] Gate 2: TL + PM revisam
   → PM REJEITADO: "Email não enviado para player2Email, apenas player1Email"
3. [AUTO] Enviar feedback ao dev
4. Dev corrige APENAS o envio para player2Email
5. [AUTO] Reiniciar do Gate 1 (todos os 7 revisores novamente)
   → Todos os 7 APROVADOS
6. [AUTO] Gate 2 novamente: TL + PM revisam
   → Ambos APROVADOS
   → Task 1.2 = "sprint-done"
```

### Fim de Sprint 1 (todas as tasks são "sprint-done"):

```
1. [AUTO] Gate 3: CTO + CPO revisam TODAS as tasks
   → CTO: todas APROVADAS
   → CPO: REJEITOU task 1.6 ("Share button não funciona no iOS Safari")
2. [AUTO] Enviar feedback ao dev para task 1.6 APENAS
3. Dev corrige o problema no iOS Safari
4. [AUTO] Task 1.6 reinicia Gate 1 → Gate 2 → passa
5. [AUTO] Gate 3 re-roda APENAS para task 1.6
   → Ambos APROVADOS
6. [AUTO] Gate 4: CEO revisa TODAS as tasks
   → Todas APROVADAS
7. [AUTO] Gate 5: QA Agent abre browser, testa todas as tasks
   → Todas as tasks PASSARAM (screenshots capturados, APIs verificadas)
8. [HUMANO] Gate 6: Demo com passos claros de teste
   - "Passo 1: Acesse http://localhost:5173/tournaments, inscreva-se → verifique email recebido"
   - "Passo 2: Acesse http://localhost:5173/termos → verificar conteúdo e link no footer"
   → Usuário: "aprovado"
9. [AUTO] Gate 7: Release Agent executa commit + push + verifica deploy Railway
   → Commit hash: abc123
   → Push: sucesso
   → Deploy Railway: sucesso
   → Pós-deploy verificado: /health retorna 200
```
