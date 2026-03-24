# BubblePadel — Backlog Sprint 5+ (Pós-Lançamento)

## Rascunho para auditoria completa pós-Sprint 3

**Última atualização:** Março 2026

> Este documento captura todas as melhorias, pendências e novas funcionalidades identificadas durante as Sprints 1-2. Será revisado e priorizado formalmente pelos 10 agentes na auditoria completa após a Sprint 3.

---

## 🔴 Pendências Técnicas (Sprints 1-2)

| Item                                                            | Origem     | Observação                                                                                            |
| --------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| Criar `og-image.png` (1200×630px, logo Bubble em fundo #050f1a) | Sprint 1.6 | Hospedar em `/public/og-image.png`, atualizar `og:image` no `index.html`                              |
| Campos obrigatórios no perfil do clube                          | Sprint 2.1 | Nome, cidade e quadras obrigatórios antes de criar 1º torneio — bloquear criação se perfil incompleto |
| Migrar contas de serviços para email empresarial                | Sprint 1-2 | Railway, Resend, Sentry, UptimeRobot, GitHub — quando tiver domínio/CNPJ                              |
| Aceite de termos obrigatório no formulário de inscrição         | Sprint 1.1 | Checkbox LGPD antes de confirmar inscrição do atleta                                                  |
| Email do clube para notificações                                | Sprint 1.3 | Resend free tier só envia para email da conta — resolver com domínio verificado                       |
| GlobalScope no AnalyticsService.kt                              | Sprint 1.5 | Tech debt — substituir por coroutine scope correto                                                    |

---

## 🟡 UX/UI — Melhorias Visuais

### Páginas Públicas

- Consistência visual entre todas as páginas (alguns cards têm padding diferente)
- Animações de entrada nos cards (fade-in suave ao scroll)
- Skeleton loading nas listagens de torneios e grupos
- Estado vazio melhorado ("Nenhum torneio encontrado" com ilustração)
- Melhorar contraste em textos menores (acessibilidade WCAG AA)

### Dashboard do Clube

- Redesign completo do dashboard — mais visual, menos tabela
- Gráficos de torneios por mês, inscrições por categoria
- Cards de torneio mais compactos com preview de status
- Responsividade do dashboard em tablet (768px)
- Dark/light mode toggle (futuramente)

### Formulário de Inscrição

- Validação em tempo real dos campos (não só no submit)
- Feedback visual mais claro no step de pagamento PIX
- Confirmação de inscrição com animação de celebração melhorada

### Página do Torneio (Pública)

- Preview de brackets de playoff mais visual
- Chaveamento estilo torneio (árvore visual)
- Placar ao vivo com atualização mais fluida
- Galeria de fotos do torneio (upload pelo clube)

---

## 🟢 Novos Tipos de Torneio

| Formato                 | Descrição                                                 | Complexidade |
| ----------------------- | --------------------------------------------------------- | ------------ |
| **Super 8**             | 8 duplas, todos jogam contra todos, top 4 vão à semifinal | Média        |
| **Round Robin**         | Todos contra todos, sem fase de grupos                    | Baixa        |
| **Mata-mata puro**      | Chaveamento direto sem fase de grupos                     | Baixa        |
| **Americano**           | Rodízio de parceiros a cada rodada                        | Alta         |
| **Mexicano**            | Americano com ranking dinâmico                            | Alta         |
| **Monges**              | Formato misto com repescagem                              | Alta         |
| **Torneio por equipes** | Clubes vs clubes, somatório de pontos                     | Alta         |

---

## 🏆 Gamificação e Engajamento

### Sistema de Badges para Atletas

- 🥇 Campeão — venceu uma categoria
- 🎯 Artilheiro — maior número de sets vencidos
- 🔥 Sequência — 3+ torneios consecutivos
- 🌟 Estreante — primeiro torneio na plataforma
- 💪 Guerreiro — participou de 10+ torneios
- 🤝 Parceiro fiel — mesma dupla em 5+ torneios
- 📈 Em ascensão — subiu posições no ranking

### Sala de Troféus

- Perfil público do atleta com vitórias, badges e histórico
- Wall of Fame do clube com campeões de cada torneio
- Certificado digital personalizado por torneio (gerado em PDF)
- Compartilhamento de troféu no Instagram/WhatsApp

### Sistema de Ranking Avançado

- Pontuação por resultado (campeão = 100pts, vice = 75pts, etc.)
- Ranking por categoria, cidade e estado
- Ranking nacional de padel e beach tennis
- Histórico de evolução no ranking (gráfico de linha)
- Comparação head-to-head entre dois atletas

---

## 📊 Estatísticas e Relatórios

### Para o Clube

- Dashboard financeiro completo: receita por mês, por categoria, por torneio
- Relatório de participação: atletas recorrentes, taxa de retenção
- Heatmap de horários mais disputados nas quadras
- Relatório de categorias mais populares
- Export de dados em CSV/Excel
- Comparativo entre torneios

### Para o Atleta

- Estatísticas pessoais: win rate, sets ganhos/perdidos, média de pontos
- Histórico completo de torneios com resultados detalhados
- Gráfico de evolução de performance ao longo do tempo
- Análise por parceiro: melhor dupla, piores adversários
- Metas pessoais: "Quero chegar ao top 10 da minha cidade"

### Para a Bubble (Admin)

- Dashboard de crescimento: clubes ativos, atletas cadastrados, torneios realizados
- Funil de conversão: clube cadastrado → torneio criado → torneio pago
- Mapa de calor geográfico dos clubes
- Métricas de churn e retenção

---

## 👤 Perfil Pages Completas

### Perfil do Clube (público)

- Foto de capa e logo do clube
- Descrição, endereço com mapa
- Histórico de torneios realizados
- Galeria de fotos
- Avaliações e depoimentos de atletas
- Próximos torneios em destaque
- Contato direto pelo WhatsApp

### Perfil do Atleta (público)

- Foto, nome, cidade, modalidade preferida
- Stats: torneios jogados, títulos, ranking atual
- Sala de troféus com badges
- Parceiro(s) habitual(is)
- Feed de atividade recente
- Opção de seguir atleta (notificações de torneios)

---

## 🗺️ Heatmap e Visualizações

- **Heatmap de quadras:** quais quadras têm mais jogos, horários de pico
- **Mapa geográfico:** onde estão os clubes e atletas cadastrados no Brasil
- **Bracket visual interativo:** chaveamento estilo tênis com drag-and-drop
- **Timeline do torneio:** linha do tempo visual com todos os jogos

---

## 📱 App Mobile

- Avaliar PWA (mais rápido) vs React Native (melhor UX)
- MVP do app: página pública, inscrição, meus torneios, live scoring
- Push notifications para lembretes de jogos
- QR Code de check-in no torneio
- Câmera para registrar placares

---

## 🔧 Melhorias Técnicas

- CI/CD com GitHub Actions (testes automáticos antes do deploy)
- Testes de API automatizados (Jest + Supertest)
- Cache Redis para queries frequentes (rankings, listagens)
- CDN para assets estáticos
- Backup automático do banco de dados
- Suporte a múltiplos idiomas (EN/ES para expansão)
- Stripe como segundo gateway de pagamento (cartão de crédito)
- NFS-e automática após pagamento

---

## 🚀 Expansão de Mercado (Sprint 6+)

- **Outros esportes:** Beach Tennis já no DNA, depois Tênis, Pickleball, Squash
- **Multi-club:** um organizador gerencia múltiplos clubes
- **Liga inter-clubes:** torneios que agrupam múltiplos clubes numa liga
- **Programa de indicação:** clube indica clube, ambos ganham desconto
- **Marketplace de equipamentos:** raquetes, bolinhas com comissão
- **Perfil Professor:** agendamento de aulas com pagamento via plataforma
- **Torneio entre amigos:** atletas organizam torneios informais

---

## 📋 Como Usar Este Documento

1. **Durante Sprints 1-4:** adicionar itens livremente, sem priorizar
2. **Pós-Sprint 3:** auditoria completa dos 10 agentes revisará e priorizará
3. **Sprint 5 em diante:** backlog formal gerado a partir desta lista
4. **Regra:** nenhum item daqui entra numa sprint ativa sem passar pela auditoria

---

_Última revisão: Rafael Couto — Março 2026_
