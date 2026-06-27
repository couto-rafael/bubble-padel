# GAMIFICATION_AUDIT — Bubble Padel

**Auditor:** gamification specialist
**Data:** 17-jun-2026
**Escopo:** Estado de gamificação pós-Sprint 9, baseline pré-Sprint 10
**Referências:** `GamificationService.ts` · `bubble_padel_briefing.html` (Sprint 5 timeline) · `bubble_padel_backlog.html` Sprint 5/5.5 · userMemories Sprint 9 (TROPHY + MATCH_RESULT posts)

---

## 1. Score Consolidado

**Nota geral: 5.8 / 10**

| Dimensão | Nota | Observação |
|---|---|---|
| Catálogo de achievements (cobertura) | 7 | ✅ 14 achievements, 4 categorias, 5 tiers |
| Trophy Room (qualidade) | 6 | ⚠️ Só campeão/vice — 80% dos atletas sem visual reward |
| Sistema de Pontos de Liga | 8 | ✅ Bem implementado, faltam oitavas/16avos |
| Ranking | 6 | ⚠️ Por categoria OK, sem decaimento temporal nem multiplicador |
| Auto-posts no feed (Sprint 9) | 7 | ✅ TROPHY/MATCH_RESULT enriquecidos · ❌ Super8 quebrado |
| Notificação de conquista | 3 | ❌ Não existe in-app, atleta precisa visitar perfil |
| Compartilhamento social externo | 2 | ❌ Image gen Strava-style não existe (depende public profile) |
| Gamificação para clube (B2B) | 2 | ❌ Zero badges/achievements pro organizador |
| Não desmotivar iniciantes | 6 | ⚠️ Achievements OK, mas Trophy só pra campeão limita |
| Anti-streak (decisão deliberada) | 9 | ✅ Bem alinhado com filosofia, sazonalidade respeitada |
| Conexão com feed social (loop) | 7 | ✅ Feed Sprint 9 amplia conquistas |

---

## 2. O Que Está OK ✅

### Catálogo de achievements (Sprint 5)

14 achievements em 4 categorias com 5 tiers (Bronze/Silver/Gold/Diamond/Legend):

| Categoria | Keys |
|---|---|
| Participação | `first_tournament`, `regular_player`, `monthly_player` |
| Performance | `first_title`, `champion`, `finalist`, `podium_streak`, `undefeated_group` |
| Social | `loyal_partner`, `explorer`, `versatile`, `road_warrior` |
| Plataforma | `profile_complete`, `early_adopter`, `league_debut` |

Função `getTierForValue()` resolve tier por threshold corretamente. Boa cobertura horizontal (4 dimensões de comportamento).

### Trophy Room técnica (Sprint 5)
- Trophy = apenas campeão e vice via playoffs (sem inflação)
- `awardTrophies()` chamado em `processCompletedTournament()`
- Hidratação correta de torneio/categoria/colocação no AthleteProfile
- `AthleteTrophy` model com dados estruturados (não só badge string)

### Sistema de Pontos de Liga
- Configurável: `pointsChampion`, `pointsRunnerUp`, `pointsSemi`, `pointsQuarter`, `pointsGroup` no schema League
- Upsert idempotente em `LeaguePoints` com chave composta `leagueId_athleteId_tournamentId_category`
- `awardLeaguePoints()` é no-op se torneio avulso (não vinculado) — comportamento correto
- **Decisão firme**: ranking SEMPRE por categoria, nunca geral (alinhada com filosofia "não desmotivar iniciantes" — atleta de 7ª não compete com Open)

### Auto-posts Sprint 9 (loop social)
- `TROPHY` post auto-gerado via `awardTrophies()` com badge CAMPEÃO/VICE
- `MATCH_RESULT` enriquecido: parceiro, adversários, fase, placar
- Dedup por matchId no GET `/feed` (priorizando post do requester)
- Privacy gate respeitado: `settings.matches === "PRIVATE"` → pula geração
- `generateTrophyPosts` chamado por cron E manual `syncStatus` (gap histórico já corrigido)

### Anti-streak (decisão deliberada)
Skill explicitamente evita "streaks que punem ausência" → não existem no produto. Coerente com sazonalidade real do padel/beach tennis (atleta some no inverno).

---

## 3. Gaps Identificados

### 🔴 BLOQUEADORES — gap de dados crítico

**3.1 — Super8Match não gera auto-post (carry-over Sprint 8.5)**

Memórias confirmam: "Super8Match continua sem auto-post — bug crítico Sprint 10".

- `processCompletedTournament()` chama `awardTrophies()` → funciona pra formato Regular (group + playoffs)
- Super 8 usa `Super8Match` schema diferente — `awardTrophies()` não enxerga
- Resultado: torneios Super 8 finalizam sem nenhum post de TROPHY ou MATCH_RESULT
- Para o atleta: silêncio total no feed após torneio Super 8

**Impacto:** Super 8 é formato popular em clubes brasileiros (rápido, social). Lançar produto sem auto-post no formato mais "feed-friendly" mata o loop social pra esse subset.

**Ação Sprint 10**: estender `awardTrophies()` + `maybeCreateMatchResultPost()` pra ler `Super8Match`. Mapear posições (1º, 2º, 3º, 4º) e disparar posts equivalentes.

**3.2 — Oitavas e 16avos não pontuam em liga**

Memórias mencionam pendência: "Oitavas (roundSize=8) / 16avos (roundSize=16) league points support: add `+pointsRound16 Int?` + `+pointsRound32 Int?` to schema".

- Torneios grandes (32-64 duplas) têm fase de 16avos antes das quartas
- Atleta eliminado nos 16avos hoje recebe **zero pontos de liga** — mesmo tendo passado pela fase de grupos e ganho 1 partida de 16avos
- Resultado: desmotivação real em torneios de escala

**Ação Sprint 11**: adicionar `pointsRound16` (default 15) e `pointsRound32` (default 5) no schema League + LeagueTournament. GamificationService detecta `roundSize` e resolve. Esforço 4h.

### ⚠️ RISCO — qualidade do loop de engajamento

**3.3 — Trophy Room só mostra campeão/vice**

Decisão de produto declarada: "Trophy = apenas campeão e vice via playoffs (não inflado)".

Razão da decisão: evitar inflação de troféu (qualquer participação vira trophy → trophy perde significado).

Problema oposto: **80% dos atletas em qualquer torneio não são campeão nem vice**. Em torneio de 32 duplas, 30 ficam sem nada visualmente no perfil. Atleta que chegou em quartas tem o mesmo Trophy Room que atleta que ficou na fase de grupos: vazio.

**Tensão real**: rigor estatístico vs incentivo de participação.

**Proposta**: criar **camada intermediária** entre achievements (já existe) e Trophy (só campeão/vice):
- **Performance Cards**: `MATCH_RESULT` posts no feed já carregam a info (fase, colocação)
- No AthleteProfile, criar seção "Última Caminhada" abaixo do Trophy Room: "Top 4 — Aberto Misto Verão" sem ser badge dourado, só registro visual neutro
- Mantém Trophy Room "puro" mas dá visibilidade pra performance parcial

Esforço: 4h (consulta agregada por atleta + componente visual).

**3.4 — Notificação de conquista não existe in-app**

Cenário hoje:
1. Atleta termina torneio
2. `processCompletedTournament` roda cron, calcula achievements
3. Atleta desbloqueia "Bicampeão" tier Silver
4. **Atleta não sabe** — só descobre se visitar AthleteProfile aba achievements

Em Strava/Duolingo/Nike Run Club, conquista vira **evento celebrado** — animação, modal, push notification. Aqui é silencioso.

**Sem celebração, a mecânica de gamificação só funciona para atletas que **procuram** ver progresso. Atletas casuais perdem a recompensa emocional.

**Proposta Sprint 11+** (fase 2 de gamificação):
- Email "🎉 Conquista desbloqueada!" disparado em `evaluateAchievements()` quando tier novo
- Toast in-app no próximo login: "Você desbloqueou X (Gold)"
- (Eventualmente) push notification quando PWA estiver no roadmap

**3.5 — Sem mecânica de compartilhamento social externo**

Skill propõe: "Badge conquistado → imagem pré-gerada para WhatsApp/Instagram. Formato: fundo escuro #050f1a + badge + 'Conquista desbloqueada no Bubble Padel'".

Não existe. Sprint 9 entregou Web Share API pra post do feed — só compartilha link da Bubble, não imagem.

**Impacto**: gamificação não converte em aquisição. Strava cresceu por WhatsApp com prints/cards de atividade. Bubble não tem o equivalente.

**Dependências**:
- Public athlete profile `/athletes/:id` (parqueado) — pra compartilhar link
- OG image dinâmica (parqueada) — pra preview no WhatsApp
- Image gen server-side (Satori, ou Cloudinary transforms) — pra card de badge

**Ação Sprint 12+**: depois que public profile entrar, image gen de badge entra. Não é crítico pré-lançamento, mas é o **canal de crescimento orgânico** mais provável pra B2C.

**3.6 — Gamificação 100% atleta, zero clube (B2B)**

Skill original prevê categoria "Clube" com 3 badges:
- 🏗️ Primeiro Torneio (clube cria primeiro torneio)
- 🎪 Organizador (5 torneios concluídos)
- 🌍 Hub da Região (50+ atletas únicos)

Nada implementado. Clube usa a plataforma e não recebe nenhum feedback gamificado.

**Implicação cruzada (PRODUCT_STRATEGY 3.5)**: princípio "clube primeiro" foi violado em Sprints 7-9, e gamificação reflete isso — atleta tem trophy room + achievements + posts; clube tem dashboard financeiro.

**Ação Sprint 11/12**: implementar 3 badges de clube + exibir no ClubDashboard (header). Esforço 6h (schema `ClubAchievement` + service + UI).

**3.7 — Sem multiplicador por tamanho do torneio**

Skill propõe:
| Duplas | Multiplicador |
|---|---|
| Até 8 | 0.7× |
| 9-16 | 1.0× |
| 17-32 | 1.3× |
| 33+ | 1.6× |

Não existe. Atleta que ganha torneio de 4 duplas (Super 8) tem o mesmo `pointsChampion` que ganhador de torneio de 64 duplas. Estatisticamente injusto, desmotiva atletas top de torneios grandes.

**Decisão a tomar**: implementar multiplicador, ou aceitar que liga é "uma temporada de torneios equivalentes" (mais simples, menos justo)?

**Recomendação**: implementar quando houver dado real. Sem 3+ torneios diferentes na mesma liga, multiplicador é teoria.

**3.8 — Sem decaimento temporal**

Skill propõe: "pontos de torneios >6 meses atrás valem menos".

Não existe. Atleta ativo há 2 anos tem ranking inflado por torneios antigos.

**Decisão**: aceitar pra MVP (atleta novo na liga não tem histórico pra decair), revisar quando 2+ temporadas existirem.

### ✅ RECOMENDADO — postura

**3.9 — Categoria "Plataforma" tem `early_adopter` sem critério explícito**

`early_adopter` no catálogo — em algum momento o critério "primeiros 100 atletas" para de fazer sentido (#101 nunca vai conquistar).

**Ação**: documentar threshold congelado (ex: "atletas cadastrados antes de 31-12-2026 desbloqueiam"). Sem isso, fica meta-achievement que confunde.

**3.10 — Notificação "você subiu no ranking" não existe**

Skill menciona como Fase 2. Não implementado.

**Risco**: atleta sobe 5 posições na liga e nunca sabe — perde o pico de dopamina.

**Ação Sprint 12+**: email semanal "Sua semana no Bubble" — resumo: posição na liga, conquistas próximas do próximo tier, próximos torneios da liga. Esforço 6h (cron semanal + template).

**3.11 — `monthly_player` pode punir sazonalidade**

`monthly_player`: 3 torneios em meses diferentes.

Em Joinville, padel é forte verão-outono. Atleta pode fazer 5 torneios em fev-mar-abr (3 meses ✓) ou 6 torneios em fev (1 mês ✗). Achievement premia distribuição, não volume.

**Coerente com filosofia (premiar recorrência)**, **mas cuidado**: em região nordestina, atleta joga praia o ano todo — fácil. Em região sul, inverno tira 3 meses — difícil.

**Ação**: aceitar como está. Monitorar % atletas que desbloqueiam por região. Se < 30% no sul, repensar critério.

---

## 4. Sprint 10 — Itens de Gamificação

Sprint 10 declarada inclui apenas:
- **Super8 auto-post** ✅ (gap 3.1 — crítico)

Outros itens de gamificação no backlog parqueado:
- Oitavas / 16avos pontos de liga
- Sala de Troféus pública por liga
- Public athlete profile `/athletes/:id` (dependência pra share)
- Notificação de mention in-app (cruza com Copy/Product)

Recomendação Sprint 10: **focar Super8 auto-post**. Outros vão pra Sprint 11/12.

---

## 5. Roadmap de Gamificação Proposto

### Fase 1 — Sprint 10 (em curso)
- ✅ Corrigir Super8 auto-post (loop social)

### Fase 2 — Sprint 11/12 (pós-alpha real)
- Oitavas/16avos pontos de liga
- "Última Caminhada" no AthleteProfile (gap 3.3)
- 3 badges de clube + ClubDashboard (gap 3.6)
- Email de conquista desbloqueada (gap 3.4)
- Documentar threshold de `early_adopter` (gap 3.9)

### Fase 3 — Sprint 13+ (pós-lançamento público)
- Public athlete profile `/athletes/:id`
- OG image dinâmica
- Image gen de badge (Cloudinary/Satori)
- Email semanal "Sua semana no Bubble" (gap 3.10)
- Multiplicador por tamanho (gap 3.7) — quando houver dado real
- Decaimento temporal (gap 3.8) — quando houver 2+ temporadas

### Fase 4 — Sprint 15+ (escala)
- Ranking municipal/regional (skill propõe cidade → regional → nacional)
- Streaks opcionais com escudo protetor (Duolingo-style) — só se demanda comprovada
- Certificados digitais (já no backlog 5.6)

---

## 6. Recomendações Priorizadas

| # | Ação | Prioridade | Esforço | Fase |
|---|---|---|---|---|
| 1 | Super8 auto-post (TROPHY + MATCH_RESULT) | 🔴 | 6h | Sprint 10 |
| 2 | Oitavas/16avos pontos de liga | ⚠️ | 4h | Sprint 11 |
| 3 | "Última Caminhada" no AthleteProfile (top 4, top 8) | ⚠️ | 4h | Sprint 11 |
| 4 | 3 badges de clube + exibição ClubDashboard | ⚠️ | 6h | Sprint 11 |
| 5 | Email "Conquista desbloqueada" no `evaluateAchievements` | ⚠️ | 4h | Sprint 12 |
| 6 | Documentar threshold congelado de `early_adopter` | ✅ | 30min | Sprint 11 |
| 7 | Image gen de badge (Satori/Cloudinary) | ✅ | 8h | Sprint 13 |
| 8 | Email semanal "Sua semana no Bubble" | ✅ | 6h | Sprint 13 |
| 9 | Multiplicador por tamanho | ✅ | 3h | quando dado existir |
| 10 | Decaimento temporal | ✅ | 4h | quando 2 temporadas |

---

## 7. Itens Sugeridos para BACKLOG.md

```
## Gamification

- [P0] Super8Match auto-post (TROPHY + MATCH_RESULT) — corrigir gap silencioso (Sprint 10)
- [P1] Oitavas (roundSize=8) e 16avos (roundSize=16) league points: schema +pointsRound16 +pointsRound32, GamificationService detect roundSize, LeaguesDashboard collapsible "Etapas Avançadas"
- [P1] "Última Caminhada" no AthleteProfile — exibir top 4 / top 8 (não-badge, registro visual neutro) abaixo do Trophy Room
- [P1] 3 badges de clube: 🏗️ Primeiro Torneio, 🎪 Organizador (5 torneios), 🌍 Hub da Região (50+ atletas únicos) + exibição ClubDashboard
- [P2] Email "🎉 Conquista desbloqueada!" disparado em evaluateAchievements quando tier novo
- [P2] Documentar threshold congelado de early_adopter (data corte)
- [P2] Toast in-app de conquista desbloqueada no próximo login
- [P3] Image gen server-side de badge (Satori ou Cloudinary transforms) — depende public profile
- [P3] Email semanal "Sua semana no Bubble" (cron + template)
- [P3] Multiplicador por tamanho de torneio (esperar dado real de 3+ torneios)
- [P3] Decaimento temporal de pontos de liga (esperar 2+ temporadas)
- [P3] Sala de Troféus pública por liga (depende public league page do BACKLOG existente)
```

---

## 8. Trigger para Próxima Revisão de Gamificação

Refazer auditoria quando:
- Após primeiros 50 atletas com achievement Gold+ — analisar distribuição (algum tier inflado/deflado?)
- Após primeira liga de uma temporada completa rodar — validar pontuação por roundSize
- Antes de lançar public athlete profile — pra ter image gen pronto
- Se NPS atleta cair abaixo de 7 — investigar se gamificação está desmotivando
