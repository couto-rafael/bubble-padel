// ─────────────────────────────────────────────────────────────────────────────
// CAMADA DE SERVIÇOS — API
//
// HOJE: todas as funções usam localStorage (mock).
// PARA INTEGRAR COM BACKEND: substituir o corpo de cada função por um
// fetch/axios real apontando para o endpoint correspondente.
//
// Exemplo de troca:
//   ANTES:  const data = JSON.parse(localStorage.getItem("tournaments") ?? "[]")
//   DEPOIS: const res = await fetch(`${API_URL}/tournaments`, { headers: authHeaders() })
//           const data = await res.json()
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Tournament,
  Team,
  Group,
  Match,
  Schedule,
  Set,
  ApiResponse,
} from "../types";

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "";

// Retorna headers com token de auth para requisições protegidas
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Handler de erro padrão
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

// ─── STORAGE KEYS (apenas enquanto usar localStorage) ────────────────────────

const KEYS = {
  tournaments: "tournaments",
  teams: (id: string) => `teams_${id}`,
  groups: (id: string) => `groups_${id}`,
  schedule: (id: string) => `schedule_${id}`,
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─────────────────────────────────────────────────────────────────────────────
// TORNEIOS
// ─────────────────────────────────────────────────────────────────────────────

export const TournamentService = {
  // GET /tournaments
  list: async (): Promise<Tournament[]> => {
    // TODO: return handleResponse<Tournament[]>(await fetch(`${API_URL}/tournaments`, { headers: authHeaders() }))
    return getLocal<Tournament[]>(KEYS.tournaments, []);
  },

  // GET /tournaments/:id
  get: async (id: string): Promise<Tournament | null> => {
    // TODO: return handleResponse<Tournament>(await fetch(`${API_URL}/tournaments/${id}`, { headers: authHeaders() }))
    const list = getLocal<Tournament[]>(KEYS.tournaments, []);
    return list.find((t) => t.id === id) ?? null;
  },

  // POST /tournaments
  create: async (data: Partial<Tournament>): Promise<Tournament> => {
    // TODO: return handleResponse<Tournament>(await fetch(`${API_URL}/tournaments`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }))
    const now = new Date().toISOString();
    const tournament: Tournament = {
      id: Date.now().toString(),
      status: "draft",
      totalTeams: 0,
      courts: [],
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Tournament;
    const list = getLocal<Tournament[]>(KEYS.tournaments, []);
    setLocal(KEYS.tournaments, [...list, tournament]);
    return tournament;
  },

  // PATCH /tournaments/:id
  update: async (id: string, data: Partial<Tournament>): Promise<Tournament> => {
    // TODO: return handleResponse<Tournament>(await fetch(`${API_URL}/tournaments/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(data) }))
    const list = getLocal<Tournament[]>(KEYS.tournaments, []);
    const updated = list.map((t) =>
      t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
    );
    setLocal(KEYS.tournaments, updated);
    return updated.find((t) => t.id === id)!;
  },

  // DELETE /tournaments/:id
  delete: async (id: string): Promise<void> => {
    // TODO: await fetch(`${API_URL}/tournaments/${id}`, { method: "DELETE", headers: authHeaders() })
    const list = getLocal<Tournament[]>(KEYS.tournaments, []);
    setLocal(KEYS.tournaments, list.filter((t) => t.id !== id));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INSCRIÇÕES (TEAMS)
// ─────────────────────────────────────────────────────────────────────────────

export const TeamService = {
  // GET /tournaments/:tournamentId/teams
  list: async (tournamentId: string): Promise<Team[]> => {
    // TODO: return handleResponse<Team[]>(await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, { headers: authHeaders() }))
    return getLocal<Team[]>(KEYS.teams(tournamentId), []);
  },

  // POST /tournaments/:tournamentId/teams
  create: async (tournamentId: string, data: Partial<Team>): Promise<Team> => {
    // TODO: return handleResponse<Team>(await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }))
    const team: Team = {
      id: Date.now().toString(),
      tournamentId,
      registrationDate: new Date().toISOString().split("T")[0],
      status: "pending",
      paymentStatus: "pending",
      amount: 0,
      hasRestriction: false,
      ...data,
    } as Team;
    const list = getLocal<Team[]>(KEYS.teams(tournamentId), []);
    setLocal(KEYS.teams(tournamentId), [...list, team]);
    return team;
  },

  // PATCH /teams/:id
  update: async (tournamentId: string, id: string, data: Partial<Team>): Promise<Team> => {
    // TODO: return handleResponse<Team>(await fetch(`${API_URL}/teams/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(data) }))
    const list = getLocal<Team[]>(KEYS.teams(tournamentId), []);
    const updated = list.map((t) => (t.id === id ? { ...t, ...data } : t));
    setLocal(KEYS.teams(tournamentId), updated);
    return updated.find((t) => t.id === id)!;
  },

  // DELETE /teams/:id
  delete: async (tournamentId: string, id: string): Promise<void> => {
    // TODO: await fetch(`${API_URL}/teams/${id}`, { method: "DELETE", headers: authHeaders() })
    const list = getLocal<Team[]>(KEYS.teams(tournamentId), []);
    setLocal(KEYS.teams(tournamentId), list.filter((t) => t.id !== id));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GRUPOS
// ─────────────────────────────────────────────────────────────────────────────

export const GroupService = {
  // GET /tournaments/:tournamentId/groups
  list: async (tournamentId: string): Promise<Group[]> => {
    // TODO: return handleResponse<Group[]>(await fetch(`${API_URL}/tournaments/${tournamentId}/groups`, { headers: authHeaders() }))
    return getLocal<Group[]>(KEYS.groups(tournamentId), []);
  },

  // POST /tournaments/:tournamentId/groups  (salva sorteio gerado no cliente)
  save: async (tournamentId: string, groups: Group[]): Promise<Group[]> => {
    // TODO: return handleResponse<Group[]>(await fetch(`${API_URL}/tournaments/${tournamentId}/groups`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ groups }) }))
    const withFk = groups.map((g) => ({ ...g, tournamentId }));
    setLocal(KEYS.groups(tournamentId), withFk);
    return withFk;
  },

  // POST /tournaments/:tournamentId/groups/generate (backend gera)
  generate: async (tournamentId: string): Promise<Group[]> => {
    // TODO: return handleResponse<Group[]>(await fetch(`${API_URL}/tournaments/${tournamentId}/groups/generate`, { method: "POST", headers: authHeaders() }))
    // Por enquanto a geração acontece no cliente (groupUtils.ts) e é salva via save()
    throw new Error("Geração via backend ainda não implementada. Use o cliente.");
  },

  // DELETE /tournaments/:tournamentId/groups
  reset: async (tournamentId: string): Promise<void> => {
    // TODO: await fetch(`${API_URL}/tournaments/${tournamentId}/groups`, { method: "DELETE", headers: authHeaders() })
    setLocal(KEYS.groups(tournamentId), []);
  },

  // PATCH /matches/:matchId/score
  saveScore: async (
    tournamentId: string,
    groupId: string,
    matchId: string,
    payload: { score1: number; score2: number; wo?: 1 | 2; sets?: Set[] }
  ): Promise<Group[]> => {
    // TODO:
    // const updated = await handleResponse<Group>(await fetch(`${API_URL}/matches/${matchId}/score`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload) }))
    // queryClient.invalidateQueries(['groups', tournamentId])
    // Por agora: atualiza localmente e persiste
    const groups = getLocal<Group[]>(KEYS.groups(tournamentId), []);
    // A lógica de recalculate continua no cliente por ora
    // (será movida para backend na Fase 3)
    setLocal(KEYS.groups(tournamentId), groups);
    return groups;
  },

  // PATCH /groups/:groupId/teams/reorder  (drag & drop)
  reorderTeams: async (
    tournamentId: string,
    groups: Group[]
  ): Promise<void> => {
    // TODO: await fetch(`${API_URL}/tournaments/${tournamentId}/groups/reorder`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ groups }) })
    setLocal(KEYS.groups(tournamentId), groups);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENDAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export const ScheduleService = {
  // GET /tournaments/:tournamentId/schedule
  get: async (tournamentId: string): Promise<Record<string, Schedule>> => {
    // TODO: return handleResponse<Record<string, Schedule>>(await fetch(`${API_URL}/tournaments/${tournamentId}/schedule`, { headers: authHeaders() }))
    return getLocal<Record<string, Schedule>>(KEYS.schedule(tournamentId), {});
  },

  // PATCH /matches/:matchId/schedule
  update: async (
    tournamentId: string,
    matchId: string,
    data: Omit<Schedule, "matchId">
  ): Promise<void> => {
    // TODO: await fetch(`${API_URL}/matches/${matchId}/schedule`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(data) })
    const current = getLocal<Record<string, Schedule>>(KEYS.schedule(tournamentId), {});
    setLocal(KEYS.schedule(tournamentId), {
      ...current,
      [matchId]: { matchId, ...data },
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const AuthService = {
  // POST /auth/login
  login: async (email: string, password: string): Promise<{ token: string; user: any }> => {
    // TODO: return handleResponse(await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }))
    // Mock: simula login bem-sucedido
    const mockToken = `mock_token_${Date.now()}`;
    localStorage.setItem("auth_token", mockToken);
    localStorage.setItem("auth_user", JSON.stringify({ id: "1", email, name: "Usuário", type: "club" }));
    return { token: mockToken, user: { id: "1", email, name: "Usuário", type: "club" } };
  },

  // POST /auth/register
  register: async (data: Record<string, any>): Promise<{ token: string; user: any }> => {
    // TODO: return handleResponse(await fetch(`${API_URL}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }))
    const mockToken = `mock_token_${Date.now()}`;
    localStorage.setItem("auth_token", mockToken);
    const user = { id: Date.now().toString(), email: data.email, name: data.name, type: data.userType };
    localStorage.setItem("auth_user", JSON.stringify(user));
    return { token: mockToken, user };
  },

  // POST /auth/logout
  logout: async (): Promise<void> => {
    // TODO: await fetch(`${API_URL}/auth/logout`, { method: "POST", headers: authHeaders() })
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  },

  // Retorna usuário logado do storage local (substituir por validação de token)
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem("auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem("auth_token"),
};
