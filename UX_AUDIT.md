# Bubble Padel — Auditoria UX/UI — 2026-05-21

## Resumo

O frontend está funcional e tem boa cobertura de estados (loading, empty, error) nas telas principais. O design system DS v2 foi adotado parcialmente: a component library (`Button`, `Input`, `Card`, `Modal`, etc.) existe e é bem definida, mas a maioria das páginas ignora esses componentes e repete classes Tailwind inline — criando duplicação e inconsistência visual acumulada. O segundo problema sistêmico é a falta de um componente `BottomNav` centralizado: a barra de navegação mobile está copy-pasted em pelo menos 5 arquivos diferentes com pequenas variações. Há também mock data em produção (`DashboardHeader`) e links para páginas inexistentes (`/ultimos-jogos`, `/marketplace`). Severidade geral: moderada, com pontos altos isolados na confiança do usuário (mock notifications, dead links).

---

## Achados por severidade

### 🔴 Alta (quebra usabilidade ou consistência grave)

- **Mock data em produção no DashboardHeader** — `src/components/DashboardHeader.tsx` (linhas 6–41). O dropdown de notificações do painel do clube exibe 4 notificações estáticas hardcoded ("Nova dupla inscrita", "Pagamento confirmado"…). Um clube real verá sempre essas notificações falsas, independente de qualquer evento. Substituir pelo endpoint real `/notifications` (já existe e funciona em `AthleteHeader`). Esforço: P.

- **Links mortos visíveis no header de atleta** — `src/components/AthleteHeader.tsx` (linhas 210–221). Itens "Últimos Jogos" (`/ultimos-jogos`) e "Marketplace" (`/marketplace`) estão no nav principal e não existem como rotas. Clicar resulta em página 404 ou branco. Remover ou marcar como "em breve" com badge/tooltip. Esforço: P.

- **TournamentProfile usa mock data como fallback estrutural** — `src/pages/TournamentProfile.tsx` (linhas 16–67). O objeto `MOCK_TOURNAMENT` e o array `confirmedTeams` ficam declarados no topo do arquivo e são usados como dados de exibição. Se o fetch da API falhar ou o torneio não tiver dados, o usuário vê informações inventadas (endereço, telefone, email, regras fictícias). Substituir por estado de erro explícito. Esforço: M.

- **DashboardHeader não consome dados reais de clube** — `src/components/DashboardHeader.tsx` (linhas 6–11). O nome e email do clube estão hardcoded como "São Paulo Padel Club". Todo clube vê esse nome no header. O hook `useClub()` já existe e retorna os dados reais. Esforço: P.

- **Bottom Nav duplicado em 5 arquivos sem active state consistente** — `AthleteDashboard.tsx`, `AthleteProfile.tsx`, `Tournaments.tsx`, `FeedPage.tsx` (implícito), e outros. O item "Troféus" nunca acende como ativo (sem lógica de `pathname`) em todos os arquivos. O item "Perfil" usa `pathname === "/athlete/profile"` mas em `AthleteDashboard.tsx` linha 706–710 o link Troféus não tem nenhum active class. Extrair para componente `AthleteBottomNav` único. Esforço: M.

- **Busca no header de atleta é placeholder sem funcionalidade** — `src/components/AthleteHeader.tsx` (linha 229–235) e dropdown de perfil (linha 343). Clicar no ícone de busca dispara `toast.success("Busca em breve 🔍")` — o mesmo para "Encontre Atletas" no dropdown. Dois pontos de entrada visíveis no header que geram expectativa e entregam apenas um toast. Esconder completamente até implementar ou substituir por CTA mais honesto. Esforço: P.

---

### 🟡 Média (incômodo, mas não bloqueia)

- **Component library ignorada em páginas principais** — `AthleteDashboard.tsx`, `ClubDashboard.tsx`, `AthleteProfile.tsx`, `Tournaments.tsx` e outros. Nenhuma dessas páginas importa `Button`, `Card`, `StatCard`, `EmptyState` ou `Spinner` da biblioteca `../components/ui/`. Em vez disso, cada arquivo repete classes Tailwind inline para botões, cards, spinners e empty states — resultando em inconsistências sutis (ex: spinner no dashboard de atleta usa `border-blue-600/20 border-t-blue-600` inline; o `Spinner` do DS usa `border-t-[#00e87a]`). Adotar gradualmente os componentes do DS. Esforço: G.

- **StatusBadge redefinido 3 vezes** — `src/components/ui/Badge.tsx` (já tem `StatusBadge`), `src/pages/EditTournament.tsx` (linhas 29–83 define `StatusBadge` local), `src/pages/ClubDashboard.tsx` (define `STATUS_CONFIG` inline). Três implementações diferentes para o mesmo conceito. Usar sempre `StatusBadge` do DS v2. Esforço: M.

- **Input de busca na página Tournaments não usa DS Input** — `src/pages/Tournaments.tsx` (linhas 412–428). Input com classes `bg-[#0a0e1a] border border-white/[0.08] rounded-lg` — inconsistente com `rounded-xl border-[1.5px]` do DS. Todos os `<select>` de filtro também usam `rounded-lg` em vez de `rounded-xl`. Esforço: P.

- **Filtros na página Tournaments têm UX confusa** — `src/pages/Tournaments.tsx` (linhas 432–680). Os selects de filtro (Sport, Estado, Cidade, Status, Tipo) têm `value=""` fixo — o select sempre mostra o placeholder ou a label dinâmica, nunca o valor selecionado visualmente. O usuário não tem feedback visual de qual opção está ativa dentro do `<select>`. Uma tag de filtro ativo só aparece após selecionar. Em mobile, o bloco de filtros fica colapsado por padrão mas não há indicador de quantos filtros estão ativos fora do bloco. Implementar pills como estado primário de filtro ativo. Esforço: M.

- **Stat cards do AthleteProfile duplicam os do AthleteDashboard** — ambas as páginas constroem grids de 3 colunas com o mesmo dado (Inscrições, Confirmadas, Concluídos) mas com estilos levemente diferentes (tamanhos de fonte, ícones). Extrair para componente compartilhado. Esforço: M.

- **CreateTournament usa stepper sem indicação de progresso** — `src/pages/CreateTournament.tsx`. Há 7 steps (`STEPS` array, linhas 158–194) mas a UI do stepper não foi lida completamente — pelo código há `validationErrors` e `showValidationModal` (linha 271–273), mas nenhuma indicação de quantos campos obrigatórios faltam por step antes do usuário tentar avançar. Sem breadcrumb numerado visível ou % de conclusão. Adicionar barra de progresso e validação inline por step. Esforço: M.

- **AthleteEditProfile faz fetch externo ao IBGE em toda sessão** — `src/pages/AthleteEditProfile.tsx` (linhas 32–38). O cache é module-level (correto) mas o fetch para `servicodados.ibge.gov.br` é iniciado sem loading state visível e sem fallback se a API estiver indisponível. Se IBGE estiver fora, o campo de cidade fica sem opções sem mensagem alguma. Adicionar estado de fallback com input de texto livre. Esforço: P.

- **PaymentModal não usa o componente Modal do DS** — `src/components/PaymentModal.tsx`. Renderiza um overlay próprio (`fixed inset-0`) com estilos manuais em vez de usar `<Modal>` do DS. Isso cria divergência de z-index e animação. Migrar para `Modal` do DS v2. Esforço: P.

- **AuthModal não usa o componente Modal do DS** — `src/components/AuthModal.tsx`. Mesma situação: overlay próprio, não usa `<Modal>`. O input local (`inputCls`) é uma reimplementação do DS `Input`. Esforço: M.

- **Tabs da AthleteProfile não usa o componente Tabs do DS** — `src/pages/AthleteProfile.tsx` (linhas 872–886). Usa `border-b-2 -mb-px` manualmente em vez do componente `Tabs` do DS. Mesmo padrão em `AthleteSettings.tsx`. Esforço: P.

- **AthleteProfile: heatmap usa dados aleatórios** — `src/pages/AthleteProfile.tsx` (linha 272–274). A intensidade dos dias é gerada com `Math.floor(Math.random() * 3) + 2` quando um torneio coincide com a data. A cada render, o heatmap muda. Isso não transmite dado real ao usuário. Usar contagem de partidas reais ou remover. Esforço: P.

- **ClubSettings tem INPUT_CLS hardcoded sem usar DS Input** — `src/pages/ClubSettings.tsx` (linhas 7–8). Strings de classe definidas localmente como constantes em vez de usar o componente `Input` do DS. Esforço: M.

- **Página de notificações sem estado de erro** — `src/pages/NotificationsPage.tsx` (linhas 49–53). O `catch` faz `() => {}` — se a API falhar, `loading` vai para `false` e a lista fica vazia sem nenhuma mensagem ao usuário. Adicionar estado de erro com retry. Esforço: P.

- **MessagesPage sem estado de erro** — `src/pages/MessagesPage.tsx` (linhas 46–49). Mesma situação: catch silencioso, lista vazia sem explicação. Esforço: P.

- **FeedPage mostra erro em texto vermelho solto** — `src/pages/FeedPage.tsx` (linhas 64–66). `<p className="text-center text-red-500 text-sm mt-8">` sem uso do `EmptyState` do DS. Inconsistente com outros empty states. Esforço: P.

- **LeagueProfile não tem loading/error state completo** — `src/pages/LeagueProfile.tsx`. Apenas 60 linhas lidas, mas a estrutura inicial não mostra Spinner centralizado padronizado. Verificar e padronizar. Esforço: P.

- **Placement strings em inglês lowercase no ranking de ligas** — `src/pages/AthleteProfile.tsx` (linhas 1546–1556). `entry.placement.replace("_", " ")` exibe "champion", "runner up", "semi" sem capitalização ou tradução. O resto da UI está em português. Mapear para "Campeão", "Vice", "Semifinal". Esforço: P.

- **Inscrições Encerradas não diferencia de Encerrado (CLOSED vs COMPLETED)** — `src/pages/Tournaments.tsx` (linhas 42–52). Status `closed` (inscrições encerradas, torneio ainda ocorre) e `completed` (torneio finalizado) têm labels diferentes, mas o card CTA para `closed` mostra "Inscrições Encerradas" enquanto o torneio ainda pode estar acontecendo — sem link para ver grupos/resultados. Adicionar CTA "Ver resultados" para ongoing/completed. Esforço: M.

---

### 🟢 Baixa (polish, nice-to-have)

- **Depoimentos placeholder visíveis em produção** — `src/pages/Home.tsx` (linhas 608–655). Três cards de testemunhos exibem "Seu depoimento aqui." e "Você" como autor. Usuários percebem que é placeholder. Ou remover a seção ou usar cards de "Seja o primeiro!" com CTA de cadastro. Esforço: P.

- **FAQ de preços menciona "Mercado Pago, PagSeguro"** — `src/pages/Home.tsx` (linha 884). O gateway real é AbacatePay (PIX). Corrigir para refletir a tecnologia real. Esforço: P.

- **Grátis Para Sempre como promessa** — `src/pages/Home.tsx` (linha 590). "Clubes que entrarem agora mantêm acesso gratuito quando lançarmos planos pagos." Criar expectativa legal sem contrato. Revisar microcopy com time de produto. Esforço: P.

- **Bottom Nav do atleta tem ícones emoji** — todos os `BottomNav` (ex: `AthleteDashboard.tsx` linhas 685–716). Ícones `🏠📰🎾🏆👤` como texto/emoji em vez de SVGs. Em alguns Androids e fontes de sistema, tamanho e alinhamento de emoji são inconsistentes. Substituir por SVGs ou usar biblioteca de ícones. Esforço: M.

- **Stat cards com labels truncados no sidebar** — `src/pages/AthleteDashboard.tsx` (linhas 616–626). Labels "Confirm." e "Concluíd." estão abreviados com ponto desnecessário no mini-grid do sidebar. Em inglês seria "ok" mas em pt-BR parece erro. Usar labels completos ou ajustar grid. Esforço: P.

- **TrophyCard mostra data sem T12:00:00** — `src/pages/AthleteProfile.tsx` (linha 354, `formatDate(trophy.earnedAt)`). `formatDate` usa `new Date(d)` diretamente sem append de `T12:00:00`, podendo mostrar data errada em UTC-3. Esforço: P.

- **AthleteProfile: parceiro mostrado apenas pela primeira letra** — linhas 1125–1126. Avatar de parceiro exibe apenas a primeira inicial (`p.name.slice(0, 1)`). O padrão no restante da UI é 2 iniciais. Esforço: P.

- **Página Contact não foi lida** — link no nav principal. Verificar se há estados de loading/success/error no formulário de contato. Esforço: P.

- **`rounded-xl` vs `rounded-2xl` inconsistente** — em `Tournaments.tsx` cards usam `rounded-xl`, no DS o padrão é `rounded-2xl`. Normalizar para `rounded-2xl`. Esforço: P.

- **`font-black` vs `font-extrabold` misturados** — `Tournaments.tsx` (linha 267) usa `font-bold`/`font-black` no nav e headings; DS v2 define `font-extrabold` para títulos. Esforço: P.

- **Cor de background inconsistente entre telas dark** — `Home.tsx` usa `#0a0e1a`, `Tournaments.tsx` usa `#0a0e27`, `RestrictedProfileCard` usa `#0a0e1a`. DS define `#0a0e1a`. Padronizar. Esforço: P.

- **ClubDashboardProfile não lido completamente** — verificar se tem loading/error states e se usa componentes do DS. Esforço: P.

- **AthletePostCard não auditado** — componente de post no feed, verificar estados de loading de imagem e ações (like, comentar) sem feedback. Esforço: P.

---

## Temas recorrentes

**1. Component library subutilizada.** Os componentes `Button`, `Card`, `Input`, `Modal`, `Spinner`, `EmptyState`, `StatCard`, `Tabs` e `Badge` existem e estão bem implementados, mas a maioria das páginas não os importa. Cada página recria esses elementos inline com pequenas variações de estilo, gerando inconsistência visual acumulada e dificultando mudanças globais futuras.

**2. Bottom Nav duplicado sem centralização.** A barra mobile de atleta está copy-pasted em pelo menos 5 arquivos (`AthleteDashboard`, `AthleteProfile`, `Tournaments`, `FeedPage`, e possivelmente outros). Cada cópia tem pequenas divergências no active state dos links. A extração para um componente `AthleteBottomNav` é a correção de maior impacto com menor esforço.

**3. Mock/placeholder data em componentes de produção.** `DashboardHeader` exibe notificações e nome de clube hardcoded. `TournamentProfile` tem dados de torneio e regras inventados. `AthleteProfile` tem heatmap com intensidade aleatória. Isso corrói a confiança do usuário e pode causar confusão em demos ou testes reais.

**4. Catch silencioso em páginas de listagem.** `NotificationsPage`, `MessagesPage`, `FeedPage` (parcialmente) e outros fazem `catch(() => {})` — a API falha e o usuário vê uma lista vazia sem nenhum feedback. O DS tem `EmptyState` com prop `action` mas não é utilizado para erros de rede. Padronizar erro de rede com mensagem + botão de retry.
