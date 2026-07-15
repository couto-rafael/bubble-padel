# Sprint 8 — Bugs P0 + Perfil Público + Feed Social Read-Only

> Este arquivo é o plano de execução autoritativo da Sprint 8.
> Claude Code: leia inteiro antes de começar. Executar tasks na ordem indicada.
> Cada task tem seu próprio Gate 2 (checklist) e Gate 3 (entrega + teste).

---

## Princípios da Sprint

- **Sem prazo de negócio.** Foco em qualidade.
- **Ordem importa.** Cada task usa o que a anterior deixou pronto.
- **Sempre Dev Pipeline:** Gate 0 (perguntas) → Gate 1 (plano) → Gate 2 (checklist) → Gate 3 (entrega).
- **Banco:** sempre `npx prisma db push` + `npx prisma generate`. Nunca `migrate dev`.
- **Imports:** sempre relativos. Nunca `@/`.
- **Status enums:** backend MAIÚSCULO, frontend compara com `.toLowerCase()`.

---

## Decisões de produto já tomadas

| Decisão                               | Resolução                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Auto-post types                       | TROPHY (campeão+vice apenas) + MATCH_RESULT (só com amigo conectado)                    |
| Friendship model                      | Simétrica (mutual follow tipo Strava), uma row, query OR nos dois sentidos              |
| Storage de imagens                    | Cloudinary (free tier, signed upload do backend)                                        |
| Stats detalhado (8.S1)                | Dentro da Sprint 8, integra com perfil público                                          |
| Slug do perfil público                | `/athletes/:id` (cuid)                                                                  |
| Composer manual / likes / comentários | **Fora do escopo.** Sprint 9.                                                           |
| Domínio                               | Adiar decisão. Usar `import.meta.env.VITE_PUBLIC_DOMAIN` com fallback `bubblepadel.com` |

---

## Ordem de execução (dependências técnicas)

```
1. 8.B2 — BottomNav condicional             (3h)  [bug, baixo risco]
2. 8.S1 — Stats detalhado                   (8h)  [endpoint pronto, prepara perfil]
3. 8.P1 — Perfil público /athletes/:id      (8h)  [usa stats]
4. 8.P2 — Share button + OG default         (3h)  [usa perfil]
5. 8.P3 — Sponsors com Cloudinary          (10h)  [schema novo, env nova]
6. 8.P4 — Schema friendship + posts         (2h)  [schema novo]
7. 8.P5 — Endpoints friendship              (4h)  [usa schema]
8. 8.P6 — Feed page + auto-posts hooks     (12h)  [usa friendship + posts]
9. 8.P7 — Nomes clicáveis (polish)          (4h)  [usa perfil público]
                                       Total: 54h
```

---

# TASK 8.B2 — BottomNav condicional no TournamentProfile

**Estimativa:** 3h
**Prioridade:** P0
**Tipo:** Bug fix

## Contexto

O atleta logado entra em `/tournaments/:id` e o BottomNav some — porque `TournamentProfile.tsx` é página pública e tem nav próprio. Solução: renderizar `BottomNav` condicionalmente quando o usuário logado é ATHLETE.

**Side-note (não tocar nesta task):** o bug 8.B1 (logout em `/tournaments`) foi resolvido como side-effect do `AthleteHeader` em sessão anterior. Validar no smoke test desta task.

## Arquivos

- `projeto_novo/src/pages/TournamentProfile.tsx` (MODIFY)

## Checklist (Gate 2)

- [ ] Importar `BottomNav` e `AuthService` no topo do arquivo
- [ ] Adicionar state `currentUser = AuthService.getCurrentUser()` (uma vez no mount, não em hook reativo)
- [ ] Renderizar `<BottomNav />` no final do JSX (depois do main, antes do `</div>` raiz) **se** `currentUser?.type === "ATHLETE"`
- [ ] Adicionar classe `pb-20` no container principal **apenas quando atleta** — clube/anônimo mantém padding atual
- [ ] Garantir que `BottomNav` tem `z-index` maior que qualquer modal/sticky CTA mobile da página

## Teste (Gate 3)

1. Login como atleta → `/tournaments/:id` → BottomNav visível, conteúdo não cortado pelo nav
2. Login como clube → `/tournaments/:id` → BottomNav ausente
3. Sem login → `/tournaments/:id` → BottomNav ausente, modal de auth aparece se clicar inscrever
4. **Smoke test 8.B1:** login atleta → `/tournaments` (lista) → não deslogar; navegar para `/tournaments/:id` e voltar → sessão preservada

## Commit sugerido

```
fix(athlete-nav): exibe BottomNav condicional no TournamentProfile

- Renderiza BottomNav quando currentUser.type === "ATHLETE"
- Adiciona pb-20 no container principal apenas para atleta
- Valida que bug 8.B1 (logout em /tournaments) está morto
```

---

# TASK 8.S1 — Endpoint /athlete/stats detalhado

**Estimativa:** 8h
**Prioridade:** P1
**Tipo:** Backend + Frontend

## Contexto

O endpoint `GET /api/athlete/stats` hoje retorna apenas matchStats básico (Sprint 7B). Esta task expande para incluir win rate, melhores parceiros, adversários frequentes, e quebra por categoria. AthleteProfile e AthleteDashboard exibem esses dados.

## Schema

**Sem mudança.** Usa `Match`, `Registration`, `Tournament`, `Team` existentes.

## Arquivos

- `backend/src/routes/athlete.ts` (MODIFY — expandir GET /stats)
- `projeto_novo/src/services/api.ts` (MODIFY — tipo `AthleteStats`)
- `projeto_novo/src/pages/AthleteProfile.tsx` (MODIFY — substituir placeholder)
- `projeto_novo/src/pages/AthleteDashboard.tsx` (MODIFY — card resumo)

## Endpoint shape

```ts
GET /api/athlete/stats → {
  totalMatches: number,
  wins: number,
  losses: number,
  winRate: number | null,        // null se totalMatches === 0
  setsWon: number,
  setsLost: number,
  bestPartners: Array<{
    athleteId: string,
    name: string,
    avatar: string | null,
    matchesTogether: number,     // mínimo 3 para entrar na lista
    winRate: number
  }>,
  frequentOpponents: Array<{
    athleteId: string,
    name: string,
    avatar: string | null,
    headToHead: { wins: number, losses: number, totalMatches: number }
  }>,
  byCategory: Record<string, {
    matches: number,
    wins: number,
    winRate: number
  }>
}
```

## Lógica chave

- Buscar matches via `prisma.match.findMany({ where: { played: true, OR: [{ team1: { players: { some: { athleteId } } } }, { team2: { players: { some: { athleteId } } } }] }, include: { team1, team2, tournament } })`
- Agrupar em memória por parceiro (mesmo team) e adversário (team oposto)
- `winRate`: `Math.round((wins / totalMatches) * 1000) / 10` (uma casa decimal, ex 62.5)
- `bestPartners`: filtrar com `matchesTogether >= 3`, ordenar por `winRate` desc, top 5
- `frequentOpponents`: ordenar por `totalMatches` desc, top 5
- `byCategory`: chave é `category` da Registration vinculada ao Team

## Checklist (Gate 2)

- [ ] Endpoint retorna shape acima exatamente
- [ ] `winRate: null` quando `totalMatches === 0` (não retornar 0)
- [ ] Filtros: `played: true`, `tournament.status === "COMPLETED"` apenas
- [ ] `bestPartners` ignora parceiros com < 3 jogos
- [ ] Tipo `AthleteStats` exportado do `api.ts`
- [ ] AthleteProfile renderiza sem crash quando stats são null/vazios
- [ ] AthleteDashboard mostra card resumo: total matches, win rate, top partner
- [ ] Sem regressão no endpoint anterior (matchStats continua funcionando)

## Teste (Gate 3)

1. Atleta sem partidas → response com `winRate: null`, listas vazias, sem crash no frontend
2. Atleta com 5 vitórias + 3 derrotas → `winRate: 62.5`
3. Parceiro com 2 jogos juntos → não aparece em `bestPartners`
4. Categoria "Open Masculina" com 4 jogos → aparece em `byCategory`

## Commit sugerido

```
feat(athlete-stats): enriquece GET /athlete/stats com winrate, parceiros, categorias

- bestPartners (min 3 jogos), frequentOpponents (top 5)
- byCategory breakdown
- AthleteProfile substitui placeholder por stats reais
- AthleteDashboard card resumo
```

---

# TASK 8.P1 — Perfil público /athletes/:id

**Estimativa:** 8h
**Prioridade:** P1
**Tipo:** Backend + Frontend (rota nova pública)

## Contexto

Hoje `/athlete/profile` é privado (do próprio atleta). Esta task cria `/athletes/:id` como rota **pública** sem auth, respeitando `settings.privacy.profile`. É pré-requisito do botão Compartilhar (8.P2) e dos nomes clicáveis (8.P7).

## Schema

**Sem mudança.** Usa `Athlete.settings.privacy` criado na Sprint 7B.

## Arquivos

- `backend/src/routes/athletes.ts` (CREATE) — rota PÚBLICA, sem `requireAuth`
- `backend/src/index.ts` (MODIFY — registrar nova rota)
- `projeto_novo/src/pages/PublicAthleteProfile.tsx` (CREATE)
- `projeto_novo/src/services/api.ts` (MODIFY — `PublicAthleteService.get(id)`)
- `projeto_novo/src/App.tsx` (MODIFY — rota `/athletes/:id`)

## Endpoint

```ts
GET /api/athletes/:id (PÚBLICO) → {
  id: string,
  name: string,
  nickname: string | null,
  city: string | null,
  state: string | null,
  sports: string[],
  rackets: string[],
  instagramUrl: string | null,
  twitterUrl: string | null,
  avatar: string | null,
  trophies: Array<{
    tournamentId: string,
    tournamentName: string,
    category: string,
    position: 1 | 2,             // só campeão e vice nesta v1
    date: string                 // ISO
  }>,
  stats: {                       // resumo apenas, não detalhado
    totalMatches: number,
    wins: number,
    winRate: number | null
  } | null,                      // null se privacy.stats !== 'PUBLIC'
  sponsors: Array<{              // populado depois da 8.P3, retornar [] por enquanto
    id: string,
    name: string,
    logoUrl: string,
    websiteUrl: string | null
  }>
}
```

## Regras de privacidade

- `settings.privacy.profile === 'PUBLIC'` → retorna tudo
- `settings.privacy.profile === 'FOLLOWERS'` → retorna `{ id, name, nickname, avatar, sports, isFollowersOnly: true }` apenas. Resto exige header `Authorization` E ser amigo aceito (validação só implementada após 8.P5)
- `settings.privacy.profile === 'PRIVATE'` → retorna **404** (não 403, não vaza existência)
- Se `privacy.stats !== 'PUBLIC'` → `stats: null` mesmo com profile público
- Se `privacy.matches !== 'PUBLIC'` → `trophies: []` mesmo com profile público

## SEO

- `<title>{name} ({nickname}) — Bubble Padel</title>`
- `<meta name="description" content="Perfil de {name}, atleta de {sports}, {city}/{state}">`
- OG tags: `og:title`, `og:description`, `og:image` (default por enquanto), `og:url`

## Checklist (Gate 2)

- [ ] Rota registrada SEM `requireAuth`
- [ ] Defaults de privacy: `profile = 'PUBLIC'`, `stats = 'PUBLIC'`, `matches = 'PUBLIC'` (validar merge com `settings.privacy` da Sprint 7B)
- [ ] PRIVATE retorna 404 com body genérico
- [ ] FOLLOWERS retorna shape reduzido com flag `isFollowersOnly: true`
- [ ] `trophies` filtra apenas position 1 e 2, ordenado por data desc
- [ ] `sponsors: []` por enquanto (será populado em 8.P3)
- [ ] PublicAthleteProfile usa `<SEOHead>` (componente existente)
- [ ] Layout segue DS v2: `#0a0e1a` background, `rounded-2xl`, `font-extrabold`
- [ ] Botão "Editar perfil" aparece **apenas** se logado E `currentUser.id === athleteId`

## Teste (Gate 3)

1. Anônimo acessa `/athletes/:id` PÚBLICO → renderiza tudo, sem AthleteHeader
2. Atleta logado acessa próprio perfil público → vê botão "Editar perfil"
3. Privacidade PRIVATE → página renderiza "Atleta não encontrado"
4. Atleta sem trofé­us → seção "Sala de Troféus" mostra empty state
5. Inspecionar HTML: OG tags presentes
6. Testar SEO no `https://www.opengraph.xyz/url/` (ou similar) com URL deployada

## Commit sugerido

```
feat(public-profile): rota pública /athletes/:id com SEO + privacidade

- backend/routes/athletes.ts (público, sem auth)
- PublicAthleteProfile com DS v2 + SEOHead
- Respeita settings.privacy.profile (PUBLIC/FOLLOWERS/PRIVATE)
- Trophies filtrados a campeão/vice
- Stats resumida; sponsors: [] (populado em 8.P3)
```

---

# TASK 8.P2 — Share button + OG default

**Estimativa:** 3h
**Prioridade:** P1
**Tipo:** Frontend + asset

## Contexto

Botão Compartilhar no perfil público (Web Share API com fallback clipboard) + OG image padrão hospedada para preview rico no WhatsApp.

## Arquivos

- `projeto_novo/src/utils/share.ts` (CREATE)
- `projeto_novo/src/pages/PublicAthleteProfile.tsx` (MODIFY — adicionar botão)
- `projeto_novo/public/og-athlete-default.png` (CREATE — 1200×630 com logo Bubble + texto "Perfil de Atleta")
- `projeto_novo/.env` (MODIFY — adicionar `VITE_PUBLIC_DOMAIN`)
- `projeto_novo/.env.example` (MODIFY — documentar)

## Implementação

```ts
// utils/share.ts
const PUBLIC_DOMAIN = import.meta.env.VITE_PUBLIC_DOMAIN || "bubblepadel.com";

export async function shareAthleteProfile(athlete: {
  id: string;
  name: string;
}) {
  const url = `https://${PUBLIC_DOMAIN}/athletes/${athlete.id}`;
  const text = `Confira o perfil de ${athlete.name} no Bubble Padel`;

  if (navigator.share) {
    try {
      await navigator.share({ title: athlete.name, text, url });
      return { method: "native" };
    } catch (err) {
      // Usuário cancelou — silencioso
      return { method: "cancelled" };
    }
  } else {
    await navigator.clipboard.writeText(url);
    return { method: "clipboard" };
  }
}
```

## Checklist (Gate 2)

- [ ] `VITE_PUBLIC_DOMAIN` adicionada em `.env` e `.env.example`
- [ ] Helper `share.ts` cobre Web Share API + clipboard fallback
- [ ] Cancelamento do share nativo NÃO mostra erro (catch silencioso)
- [ ] OG image 1200×630 hospedada em `/public/og-athlete-default.png`
- [ ] PublicAthleteProfile referencia `/og-athlete-default.png` no `og:image`
- [ ] Botão "Compartilhar" no header do perfil público, ícone share + label
- [ ] Toast/feedback ao copiar link no fallback (sucesso, não erro)

## Teste (Gate 3)

1. Mobile com Web Share API → abre share sheet nativo
2. Desktop sem API → copia link e mostra toast "Link copiado!"
3. Cancelar share nativo → sem toast de erro
4. Preview no WhatsApp (após deploy): puxa OG default, mostra título correto
5. https://www.opengraph.xyz/ valida tags

## Commit sugerido

```
feat(share): botão compartilhar perfil + OG image default

- utils/share.ts (Web Share API + clipboard fallback)
- VITE_PUBLIC_DOMAIN env var (fallback bubblepadel.com)
- og-athlete-default.png 1200x630
- Botão no header de PublicAthleteProfile
```

---

# TASK 8.P3 — Sponsors do atleta com Cloudinary

**Estimativa:** 10h
**Prioridade:** P1
**Tipo:** Backend + Frontend + integração externa

## Contexto

Atleta pode subir até 6 logos de patrocinadores no perfil. Usa Cloudinary (free tier 25GB, transformações on-the-fly). Backend assina upload para garantir que `athleteId` no path === `req.user.athleteId`.

## Pré-requisito (manual, antes de codar)

1. Criar conta gratuita em https://cloudinary.com (Rafael)
2. Pegar `cloud_name`, `api_key`, `api_secret`
3. Criar upload preset `bubble_athlete_sponsors` (signed) com transformação:
   - `w_400,h_200,c_fit,q_auto,f_auto`
   - Folder pattern: `bubble/sponsors/{athleteId}/`
4. Adicionar credenciais no Railway (env vars do backend)

## Schema

```prisma
model AthleteSponsor {
  id          String   @id @default(cuid())
  athleteId   String
  athlete     Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  name        String
  logoUrl     String   // Cloudinary URL
  publicId    String   // para deletar do Cloudinary
  websiteUrl  String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([athleteId])
}

model Athlete {
  // ... campos existentes
  sponsors AthleteSponsor[]
}
```

## Arquivos

- `backend/prisma/schema.prisma` (MODIFY — `AthleteSponsor` + relation no Athlete)
- `backend/package.json` (MODIFY — `npm install cloudinary`)
- `backend/src/lib/cloudinary.ts` (CREATE — config + helper para signature)
- `backend/src/routes/athlete.ts` (MODIFY — endpoints sponsors)
- `projeto_novo/src/pages/AthleteEditProfile.tsx` (MODIFY — UI upload)
- `projeto_novo/src/pages/AthleteProfile.tsx` (MODIFY — seção patrocinadores privada)
- `projeto_novo/src/pages/PublicAthleteProfile.tsx` (MODIFY — seção patrocinadores pública)

## Env vars (backend)

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_PRESET=bubble_athlete_sponsors
```

## Endpoints

```
GET    /api/athlete/sponsors                    → lista do atleta logado
POST   /api/athlete/sponsors/sign               → { signature, timestamp, apiKey, folder, uploadPreset }
POST   /api/athlete/sponsors                    → { name, logoUrl, publicId, websiteUrl } salva no banco
DELETE /api/athlete/sponsors/:id                → remove do banco E do Cloudinary
PATCH  /api/athlete/sponsors/reorder            → { ids: string[] } reordena via campo `order`
```

## Fluxo upload

1. Frontend pede `POST /sponsors/sign` → backend valida limite (< 6 sponsors), retorna signature
2. Frontend faz POST direto para Cloudinary com signature + arquivo
3. Cloudinary retorna `secure_url` e `public_id`
4. Frontend chama `POST /sponsors` com `{ name, logoUrl, publicId, websiteUrl }`
5. Backend salva no banco

## Checklist (Gate 2)

- [ ] `npm install cloudinary` no backend
- [ ] Schema atualizado, `prisma db push` executado, `prisma generate` rodado
- [ ] `lib/cloudinary.ts` carrega env vars e expõe `signParams()` e `destroy(publicId)`
- [ ] `POST /sponsors/sign` valida limite de 6 antes de assinar (não depois)
- [ ] `DELETE /sponsors/:id` deleta do Cloudinary E do banco (em transaction)
- [ ] Frontend valida MIME (PNG/JPG/SVG) e tamanho (max 2MB) antes de upload
- [ ] UI mostra preview antes de confirmar upload
- [ ] UI permite drag-and-drop para reordenar (atualiza `order`)
- [ ] PublicAthleteProfile mostra sponsors apenas se `sponsors.length > 0` (sem empty state — patrocínio é opcional)
- [ ] Endpoint público `/api/athletes/:id` (8.P1) agora popula `sponsors` da tabela

## Teste (Gate 3)

1. Upload PNG 1MB → aparece no perfil em <3s
2. Upload arquivo 5MB → rejeitado no frontend antes do upload
3. Tentar upload com athleteId de outro usuário (manipular request) → 403
4. Adicionar 7º sponsor → backend rejeita com 400 "Limite de 6 patrocinadores"
5. Deletar sponsor → some do Cloudinary (verificar no dashboard)
6. Reordenar via drag-and-drop → ordem persiste após refresh
7. Acessar `/athletes/:id` público → sponsors aparecem na ordem correta

## Commit sugerido

```
feat(sponsors): patrocinadores do atleta com Cloudinary signed upload

- AthleteSponsor model + relation
- backend/lib/cloudinary.ts (config + sign + destroy)
- 5 endpoints (list, sign, save, delete, reorder)
- UI de upload com preview, validação MIME/tamanho, drag-and-drop
- Limite hard de 6 sponsors
- PublicAthleteProfile populando sponsors da DB
```

---

# TASK 8.P4 — Schema friendship + posts

**Estimativa:** 2h
**Prioridade:** P1
**Tipo:** Schema only

## Contexto

Schema Prisma para friendship simétrica (Strava-style) e posts (auto + futuros manuais). Esta task é só schema — nada de endpoint ou UI. Endpoints vêm em 8.P5, feed em 8.P6.

## Schema

```prisma
model AthleteFriendship {
  id            String           @id @default(cuid())
  requesterId   String
  requester     Athlete          @relation("FriendshipRequester", fields: [requesterId], references: [id], onDelete: Cascade)
  addresseeId   String
  addressee     Athlete          @relation("FriendshipAddressee", fields: [addresseeId], references: [id], onDelete: Cascade)
  status        FriendshipStatus @default(PENDING)
  createdAt     DateTime         @default(now())
  acceptedAt    DateTime?

  @@unique([requesterId, addresseeId])
  @@index([addresseeId, status])
  @@index([requesterId, status])
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  BLOCKED
}

model AthletePost {
  id          String   @id @default(cuid())
  athleteId   String
  athlete     Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  type        PostType
  content     String?
  imageUrl    String?
  metadata    Json?    // { tournamentId?, matchId?, leagueId?, position?, opponents?, score? }
  createdAt   DateTime @default(now())

  @@index([athleteId, createdAt])
  @@index([createdAt])  // para feed global futuro
}

enum PostType {
  MANUAL          // post escrito pelo atleta (Sprint 9)
  TROPHY          // auto: campeão ou vice
  TOURNAMENT_JOIN // auto: se inscreveu (NÃO usar nesta v1 - decidido fora)
  MATCH_RESULT    // auto: vitória/derrota com amigo conectado
}

model Athlete {
  // ... campos existentes
  sentFriendships     AthleteFriendship[] @relation("FriendshipRequester")
  receivedFriendships AthleteFriendship[] @relation("FriendshipAddressee")
  posts               AthletePost[]
}
```

## Arquivos

- `backend/prisma/schema.prisma` (MODIFY)

## Checklist (Gate 2)

- [ ] Models e enums adicionados sem quebrar models existentes
- [ ] `@@unique([requesterId, addresseeId])` impede duplicata no mesmo sentido
- [ ] Index em `[addresseeId, status]` para query "pending requests recebidas"
- [ ] Index em `[athleteId, createdAt]` para query do feed por amigo
- [ ] `npx prisma db push` executado com sucesso
- [ ] `npx prisma generate` executado
- [ ] Backend ainda compila (não rodou ainda — só compila)

## Teste (Gate 3)

1. `npx prisma studio` mostra os 2 novos models
2. Backend startup sem erro
3. `npx prisma generate` cria tipos `AthleteFriendship` e `AthletePost`
4. TypeScript compila sem erro

## Commit sugerido

```
feat(schema): AthleteFriendship + AthletePost models

- Friendship simétrica (uma row, query OR nos dois sentidos)
- Status: PENDING, ACCEPTED, BLOCKED
- Post types: MANUAL (Sprint 9), TROPHY, MATCH_RESULT
- Índices para feed e queries de pending requests
```

---

# TASK 8.P5 — Endpoints friendship

**Estimativa:** 4h
**Prioridade:** P1
**Tipo:** Backend

## Arquivos

- `backend/src/routes/friendships.ts` (CREATE)
- `backend/src/index.ts` (MODIFY — registrar rota)
- `backend/src/lib/friendship.ts` (CREATE — helper `areFriends`, `getFriendIds`)
- `projeto_novo/src/services/api.ts` (MODIFY — `FriendshipService`)

## Endpoints

```
POST   /api/friendships/request           → { addresseeId } cria PENDING
POST   /api/friendships/accept            → { friendshipId } muda para ACCEPTED
POST   /api/friendships/reject            → { friendshipId } deleta a row
DELETE /api/friendships/:id               → unfriend (deleta)
GET    /api/friendships?status=ACCEPTED   → lista (status: ACCEPTED, PENDING_RECEIVED, PENDING_SENT)
GET    /api/friendships/count/:athleteId  → { count: number } público
GET    /api/friendships/status/:athleteId → { status: 'NONE'|'PENDING_SENT'|'PENDING_RECEIVED'|'ACCEPTED' } privado
```

## Helper

```ts
// backend/src/lib/friendship.ts
export async function areFriends(a: string, b: string): Promise<boolean> {
  const f = await prisma.athleteFriendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
  return !!f;
}

export async function getFriendIds(athleteId: string): Promise<string[]> {
  const fs = await prisma.athleteFriendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: athleteId }, { addresseeId: athleteId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return fs.map((f) =>
    f.requesterId === athleteId ? f.addresseeId : f.requesterId,
  );
}
```

## Regras

- Não pode mandar request a si mesmo (`requesterId !== addresseeId`) → 400
- Se já existe row no sentido oposto com PENDING → aceitar a existente, não criar duplicata
- Se já existe row ACCEPTED em qualquer sentido → 409
- Se já existe row BLOCKED → 403 silencioso
- `accept`/`reject` só funcionam se `req.user.athleteId === friendship.addresseeId`
- `unfriend` funciona para ambos os lados (requester ou addressee)

## Checklist (Gate 2)

- [ ] 7 endpoints implementados
- [ ] Todos exigem `requireAuth` exceto `count/:athleteId`
- [ ] Helper `areFriends` e `getFriendIds` exportados de `lib/friendship.ts`
- [ ] Validação self-friendship retorna 400
- [ ] Auto-accept de pending oposto funciona (A→B pending; B pede A→B vira ACCEPTED)
- [ ] Conflict 409 quando já amigos
- [ ] PublicAthleteProfile (8.P1) chama `GET /friendships/count/:id` para mostrar "X amigos"

## Teste (Gate 3)

1. A → request B: row PENDING criada
2. A → request B novamente: 409
3. A → request A (si mesmo): 400
4. B → aceita: status ACCEPTED, `acceptedAt` setado
5. C → request B (B já amigo de A): row separada criada (independentes)
6. A → unfriend B: row removida, `areFriends(A,B) === false`
7. `GET /friendships?status=ACCEPTED` retorna lista correta para A

## Commit sugerido

```
feat(friendships): endpoints CRUD para friendship simétrica

- 7 endpoints (request/accept/reject/unfriend/list/count/status)
- Helper areFriends e getFriendIds em lib/friendship.ts
- Auto-accept quando pending oposto existe
- Self-friendship rejeitada (400)
- Count público para perfil
```

---

# TASK 8.P6 — Feed page + auto-posts

**Estimativa:** 12h
**Prioridade:** P1
**Tipo:** Backend + Frontend (a maior task da sprint)

## Arquivos

**Backend:**

- `backend/src/routes/feed.ts` (CREATE)
- `backend/src/services/PostService.ts` (CREATE — `createTrophyPost`, `maybeCreateMatchResultPost`)
- `backend/src/services/GroupService.ts` (MODIFY — chamar hook após `saveScore`)
- `backend/src/services/PlayoffService.ts` (MODIFY — chamar hook após `updateMatch`)
- `backend/src/services/Super8Service.ts` (MODIFY — chamar hook após `saveScore`)
- `backend/src/jobs/statusSync.ts` (MODIFY — gerar TROPHY posts ao COMPLETED)

**Frontend:**

- `projeto_novo/src/pages/FeedPage.tsx` (CREATE)
- `projeto_novo/src/components/AthletePostCard.tsx` (CREATE)
- `projeto_novo/src/components/BottomNav.tsx` (MODIFY — adicionar item "Feed")
- `projeto_novo/src/services/api.ts` (MODIFY — `FeedService`, tipos)
- `projeto_novo/src/App.tsx` (MODIFY — rota `/athlete/feed`)

## Endpoint feed

```
GET /api/athlete/feed?cursor=<postId>&limit=20 → {
  posts: AthletePost[] (com author embedado),
  nextCursor: string | null
}
```

Query: `posts` dos `friendIds + selfId`, ordem `createdAt desc`, paginação cursor-based.

```ts
const friendIds = await getFriendIds(req.user.athleteId);
const ids = [...friendIds, req.user.athleteId];

const posts = await prisma.athletePost.findMany({
  where: { athleteId: { in: ids } },
  orderBy: { createdAt: "desc" },
  take: limit + 1, // +1 para detectar se há próxima página
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  include: {
    athlete: { select: { id: true, name: true, nickname: true, avatar: true } },
  },
});

const hasMore = posts.length > limit;
const items = hasMore ? posts.slice(0, limit) : posts;
const nextCursor = hasMore ? items[items.length - 1].id : null;
```

## PostService

```ts
// backend/src/services/PostService.ts
export class PostService {
  // Criado quando torneio fica COMPLETED, para position 1 e 2 de cada categoria
  static async createTrophyPost(args: {
    athleteId: string;
    tournamentId: string;
    tournamentName: string;
    category: string;
    position: 1 | 2;
  }) {
    // 1. Verificar privacy.matches !== 'PRIVATE'
    // 2. Verificar não existe post duplicado para mesma combinação
    // 3. Criar post
  }

  // Criado depois de cada placar salvo, SE algum dos 4 atletas tem amigo conectado entre os outros 3
  static async maybeCreateMatchResultPost(matchId: string) {
    // 1. Buscar match com team1, team2, registrations dos 4 atletas
    // 2. Para cada atleta: verificar se tem amigo entre os outros 3
    //    - Se sim, criar post para esse atleta (verifica privacy.matches)
    //    - Não duplica: 1 post por atleta-match (unique check)
  }
}
```

## Auto-post hooks

- `GroupService.saveScore` → após salvar, chama `PostService.maybeCreateMatchResultPost(matchId)` async (não bloqueia response)
- `PlayoffService.updateMatch` → idem
- `Super8Service.saveScore` → idem
- `statusSync` job ao mudar para COMPLETED → para cada categoria, identificar position 1 e 2 (consultar bracket final), chamar `createTrophyPost`

**Cuidado:** auto-posts são fire-and-forget. Se `maybeCreateMatchResultPost` falha, log mas não quebra o save do score.

## AthletePostCard

Renderiza diferente por `type`:

- **TROPHY:** ícone troféu + "🏆 João foi campeão da categoria Open Masc no Bubble Open 2026"
- **MATCH_RESULT:** ícone partida + "João venceu Pedro/Maria 6×3 6×4 — Open Masc · Bubble Open"
- **MANUAL:** texto + foto (Sprint 9, mas card já suporta)

Avatar do autor + tempo relativo ("há 2h").

## FeedPage

- Pull-to-refresh
- Scroll infinito (carrega mais 20 ao chegar no fim)
- Empty state: "Conecte com amigos para ver atualizações" + botão "Encontrar atletas"
- Layout DS v2

## BottomNav

Adicionar item "Feed" entre "Início" e "Perfil" (ou na posição mais natural). Ícone: balão de chat ou jornal.

## Checklist (Gate 2)

- [ ] Schema 8.P4 já aplicado (pré-requisito)
- [ ] Endpoints 8.P5 já funcionando (pré-requisito)
- [ ] `PostService.createTrophyPost` com guard de privacidade e dedupe
- [ ] `PostService.maybeCreateMatchResultPost` valida amizade entre os 4 atletas, dedupe por athlete+match
- [ ] Hooks em `GroupService`, `PlayoffService`, `Super8Service` (fire-and-forget, com `.catch(log)`)
- [ ] `statusSync` gera TROPHY posts ao mudar para COMPLETED (uma vez só, idempotente)
- [ ] Endpoint `/feed` cursor-based, retorna `nextCursor`
- [ ] FeedPage com scroll infinito
- [ ] Empty state quando atleta sem amigos
- [ ] BottomNav atualizado com item "Feed"
- [ ] Card renderiza TROPHY e MATCH_RESULT corretamente
- [ ] Avatar e nome do autor clicáveis → `/athletes/:id`

## Teste (Gate 3)

1. Atleta sem amigos → feed mostra só posts próprios + empty state
2. Aceitar amigo → posts dele aparecem em refresh
3. Vencer torneio (status COMPLETED) → TROPHY post aparece em até 5min (cron statusSync)
4. Salvar placar de partida onde 2 dos 4 atletas são amigos → MATCH_RESULT post aparece
5. Privacidade `matches: PRIVATE` → auto-posts NÃO criados
6. Scroll infinito: carrega mais 20 ao chegar no fim
7. Falha no PostService NÃO quebra o save do score (verificar logs)
8. TROPHY duplicado: rodar statusSync 2x → não cria 2 posts iguais

## Commit sugerido

```
feat(feed): feed read-only com auto-posts (TROPHY + MATCH_RESULT)

- backend/services/PostService.ts (createTrophyPost, maybeCreateMatchResultPost)
- Hooks em GroupService, PlayoffService, Super8Service (fire-and-forget)
- statusSync gera TROPHY ao COMPLETED (idempotente)
- GET /api/athlete/feed cursor-based
- FeedPage scroll infinito + empty state
- AthletePostCard renderiza TROPHY/MATCH_RESULT
- Item "Feed" no BottomNav
```

---

# TASK 8.P7 — Nomes clicáveis (polish)

**Estimativa:** 4h
**Prioridade:** P2
**Tipo:** Frontend polish

## Contexto

Nomes de atletas em vários lugares hoje são strings soltas. Esta task envolve eles em `<Link to="/athletes/:id">` quando há `athleteId` disponível. Aumenta navegação para perfis públicos.

## Arquivos

- `projeto_novo/src/pages/TournamentProfile.tsx` (MODIFY — aba Atletas, lista de duplas)
- `projeto_novo/src/components/TabGrupos.tsx` (MODIFY — nomes nos grupos e nas partidas)
- `projeto_novo/src/components/TabPlayoffs.tsx` (MODIFY — nomes no bracket)
- `projeto_novo/src/components/AthletePostCard.tsx` (MODIFY — autor e atletas mencionados)
- `projeto_novo/src/services/api.ts` (verificar tipo `PublicTournament` — garantir que `team.player1Id` e `team.player2Id` vêm do backend)
- `backend/src/routes/tournaments.ts` (MODIFY se necessário — incluir `playerXId` no shape público)

## Implementação

```tsx
// Helper component
function AthleteName({
  id,
  name,
  className,
}: {
  id?: string;
  name: string;
  className?: string;
}) {
  if (id) {
    return (
      <Link
        to={`/athletes/${id}`}
        className={`hover:underline ${className || ""}`}
      >
        {name}
      </Link>
    );
  }
  return <span className={className}>{name}</span>;
}
```

## Checklist (Gate 2)

- [ ] Componente `AthleteName` criado em `components/AthleteName.tsx`
- [ ] Backend `/tournaments/:id` retorna `team.player1Id` e `team.player2Id` quando disponível
- [ ] Tipo `PublicTournament.teams[]` atualizado
- [ ] TournamentProfile aba Atletas usa `AthleteName`
- [ ] TabGrupos usa `AthleteName` (cuidado: cada nome de jogador, não a dupla inteira)
- [ ] TabPlayoffs usa `AthleteName` no bracket
- [ ] AthletePostCard usa `AthleteName` para autor
- [ ] Nomes sem `id` (placeholder, ex "Aguardando vencedor") renderizam como `<span>` simples

## Teste (Gate 3)

1. Clicar em nome de atleta na aba Atletas → navega para `/athletes/:id`
2. Clicar em nome em TabGrupos → navega
3. Clicar em "Aguardando vencedor" no bracket → não navega (sem id)
4. Hover state visível (`hover:underline`)

## Commit sugerido

```
feat(navigation): nomes de atletas clicáveis em TournamentProfile + tabs

- Componente AthleteName (Link se tem id, span se não)
- Backend retorna playerXId no shape público
- Aplicado em TournamentProfile, TabGrupos, TabPlayoffs, AthletePostCard
```

---

# Resumo: arquivos por task

| Task      | Backend | Frontend | Schema | Total                   |
| --------- | ------- | -------- | ------ | ----------------------- |
| 8.B2      | 0       | 1        | 0      | 1                       |
| 8.S1      | 1       | 3        | 0      | 4                       |
| 8.P1      | 2       | 4        | 0      | 6                       |
| 8.P2      | 0       | 4        | 0      | 4                       |
| 8.P3      | 3       | 3        | 1      | 7                       |
| 8.P4      | 0       | 0        | 1      | 1                       |
| 8.P5      | 3       | 1        | 0      | 4                       |
| 8.P6      | 6       | 5        | 0      | 11                      |
| 8.P7      | 1       | 5        | 0      | 6                       |
| **Total** | **16**  | **26**   | **2**  | **44 arquivos tocados** |

---

# Pré-requisitos antes de começar

**Manuais (Rafael):**

- [ ] Conta Cloudinary criada, credenciais em mãos (para 8.P3)
- [ ] Upload preset `bubble_athlete_sponsors` criado no Cloudinary
- [ ] Env vars do Cloudinary adicionadas no Railway (backend)
- [ ] OG image default 1200×630 desenhada e exportada como PNG (para 8.P2)
- [ ] `VITE_PUBLIC_DOMAIN` adicionado em `.env` local

**Validações antes de começar (Claude Code):**

- [ ] Smoke test 8.B1: bug de logout em `/tournaments` ainda morto?
- [ ] `settings.privacy` da Sprint 7B retornando defaults corretos no merge?
- [ ] `npx prisma generate` rodando sem DLL lock (parar backend antes)?

---

# Definition of Done da Sprint 8

- [ ] Todas as 9 tasks com Gate 3 aprovado
- [ ] Sem regressão em fluxos existentes (Auth, criação torneio, registro, pagamento, grupos, playoffs, Super 8)
- [ ] BottomNav presente em todas as páginas do atleta logado
- [ ] Perfil público compartilhável funcionando (link no WhatsApp puxa OG)
- [ ] Atleta consegue subir patrocinadores e eles aparecem no perfil público
- [ ] Atleta consegue mandar/aceitar friend request
- [ ] Feed mostra TROPHY e MATCH_RESULT de amigos automaticamente
- [ ] Privacidade respeitada em 100% dos endpoints públicos
- [ ] Logs limpos (sem erro 500 em produção)
- [ ] Documentar no `README.md` as novas env vars do Cloudinary

---

# O que NÃO está nesta sprint (não prometer ao usuário)

- ❌ Composer manual de post (texto + foto pelo atleta) → Sprint 9
- ❌ Likes / comentários / mentions / geotag → Sprint 9-10
- ❌ Notificações push de friend request ou like → Sprint 10
- ❌ TOURNAMENT_JOIN auto-post (decidido fora — só TROPHY e MATCH_RESULT)
- ❌ Semifinalista no TROPHY (só campeão e vice)
- ❌ Stats avançado (gráficos de evolução, head-to-head expandido) → backlog
- ❌ Settings/Conta: excluir conta, exportar dados → Sprint dedicada de LGPD
- ❌ Renomear "Bubble" para outra marca → sessão dedicada quando for hora
