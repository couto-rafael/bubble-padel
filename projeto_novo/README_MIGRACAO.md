# Bubble Padel Platform — Estrutura Refatorada

## Nova estrutura de pastas

```
src/
├── types/
│   └── index.ts          ← FONTE ÚNICA de todas as interfaces (Tournament, Team, Group, Match, etc.)
│
├── services/
│   └── api.ts            ← Toda comunicação com backend (hoje usa localStorage, pronto para trocar por fetch)
│
├── hooks/
│   └── index.ts          ← useTournaments, useTournament, useTeams, useGroups, useSchedule
│
├── contexts/
│   └── AuthContext.tsx   ← AuthProvider + useAuth hook
│
├── utils/
│   └── groupUtils.ts     ← Lógica de grupos/standings (re-exporta tipos de @/types)
│
├── App.tsx               ← QueryClientProvider + AuthProvider + Router
├── main.tsx              ← Entry point limpo
└── [componentes]         ← Home, EditTournament, TabGrupos, etc.
```

## Instalação

```bash
npm install
npm run dev
```

## Como trocar localStorage por API real (por entidade)

### 1. Torneios
Abrir `src/services/api.ts`, função `TournamentService.list`:
```ts
// ANTES (localStorage):
return getLocal<Tournament[]>(KEYS.tournaments, []);

// DEPOIS (API real):
const res = await fetch(`${API_URL}/tournaments`, { headers: authHeaders() });
return handleResponse<Tournament[]>(res);
```
Repetir para `get`, `create`, `update`, `delete`.

### 2. Teams
Mesma lógica em `TeamService` — trocar `getLocal/setLocal` por `fetch`.

### 3. Grupos + Resultados
Em `GroupService.save` e `GroupService.saveScore` — o backend deve receber os resultados e retornar os grupos com standings já recalculados.

### 4. Auth
Em `AuthService.login` — remover o mock e fazer fetch real para `/auth/login`. O token JWT retornado deve ser salvo no localStorage (ou httpOnly cookie — a definir com o backend).

## Variável de ambiente

Criar `.env` na raiz:
```
VITE_API_URL=https://sua-api.com/api
```

## Path aliases

Importar sempre com `@/`:
```ts
import type { Tournament } from "@/types";
import { useGroups } from "@/hooks";
import { GroupService } from "@/services/api";
```

## To-Do de integração (resumo)

- [ ] Instalar dependências: `npm install`
- [ ] Configurar `VITE_API_URL` no `.env`
- [ ] Substituir mocks em `api.ts` por fetch reais (um serviço por vez)
- [ ] Remover `MOCK_TEAMS` do `EditTournament.tsx` quando `TeamService` estiver conectado
- [ ] Conectar `AuthModal.tsx` ao `useAuth()` (comentários TODO já marcados no código)
- [ ] Adicionar `@tanstack/react-query` e substituir `useState+useEffect` nos hooks por `useQuery+useMutation`
