import type {
  Tournament,
  Team,
  Group,
  Schedule,
  Set,
  ApiResponse,
} from "../types";

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const AuthService = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: any }> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<{ token: string; user: any }>(res);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    return data;
  },

  register: async (
    data: Record<string, any>,
  ): Promise<{ token: string; user: any }> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ token: string; user: any }>(res);
    localStorage.setItem("auth_token", result.token);
    localStorage.setItem("auth_user", JSON.stringify(result.user));
    return result;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  },

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

// ─────────────────────────────────────────────────────────────────────────────
// CLUBE
// ─────────────────────────────────────────────────────────────────────────────

export interface ClubProfile {
  id: string;
  userId: string;
  name: string;
  cnpj: string | null;
  city: string;
  state: string;
  phone: string | null;
  logoUrl: string | null;
  courts: string[];
  matchDuration: number;
  defaultStartTime: string;
  defaultEndTime: string;
  createdAt: string;
  updatedAt: string;
}

export const ClubService = {
  getProfile: async (): Promise<ClubProfile> => {
    const res = await fetch(`${API_URL}/club/profile`, {
      headers: authHeaders(),
    });
    return handleResponse<ClubProfile>(res);
  },

  updateProfile: async (data: Partial<ClubProfile>): Promise<ClubProfile> => {
    const res = await fetch(`${API_URL}/club/profile`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ClubProfile>(res);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TORNEIOS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeTournament(t: any): Tournament {
  return {
    ...t,
    status: t.status?.toLowerCase() ?? "draft",
    totalTeams: t._count?.teams ?? t.totalTeams ?? 0,
    categories: t.categories ?? [],
    courts: t.courts ?? [],
  };
}

export const TournamentService = {
  list: async (): Promise<Tournament[]> => {
    const res = await fetch(`${API_URL}/tournaments`, {
      headers: authHeaders(),
    });
    const data = await handleResponse<any[]>(res);
    return data.map(normalizeTournament);
  },

  get: async (id: string): Promise<Tournament | null> => {
    const res = await fetch(`${API_URL}/tournaments/${id}`, {
      headers: authHeaders(),
    });
    const data = await handleResponse<any>(res);
    return normalizeTournament(data);
  },

  create: async (data: Partial<Tournament>): Promise<Tournament> => {
    const res = await fetch(`${API_URL}/tournaments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Tournament>(res);
  },

  update: async (
    id: string,
    data: Partial<Tournament>,
  ): Promise<Tournament> => {
    const res = await fetch(`${API_URL}/tournaments/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Tournament>(res);
  },

  delete: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/tournaments/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INSCRIÇÕES (TEAMS)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeTeam(t: any): Team {
  return {
    ...t,
    status: t.status?.toLowerCase() ?? "pending",
    paymentStatus: t.paymentStatus?.toLowerCase() ?? "pending",
  };
}

export const TeamService = {
  list: async (tournamentId: string): Promise<Team[]> => {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, {
      headers: authHeaders(),
    });
    const data = await handleResponse<any[]>(res);
    return data.map(normalizeTeam);
  },

  create: async (tournamentId: string, data: Partial<Team>): Promise<Team> => {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const created = await handleResponse<any>(res);
    return normalizeTeam(created);
  },

  update: async (
    tournamentId: string,
    id: string,
    data: Partial<Team>,
  ): Promise<Team> => {
    const payload: any = { ...data };
    if (payload.status) payload.status = payload.status.toUpperCase();
    if (payload.paymentStatus)
      payload.paymentStatus = payload.paymentStatus.toUpperCase();

    const res = await fetch(
      `${API_URL}/tournaments/${tournamentId}/teams/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      },
    );
    const updated = await handleResponse<any>(res);
    return normalizeTeam(updated);
  },

  delete: async (tournamentId: string, id: string): Promise<void> => {
    await fetch(`${API_URL}/tournaments/${tournamentId}/teams/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GRUPOS
// ─────────────────────────────────────────────────────────────────────────────

export const GroupService = {
  list: async (tournamentId: string): Promise<Group[]> => {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/groups`, {
      headers: authHeaders(),
    });
    return handleResponse<Group[]>(res);
  },

  save: async (tournamentId: string, groups: Group[]): Promise<Group[]> => {
    const payload = {
      groups: groups.map((g) => ({
        name: g.name,
        category: g.category,
        teams: g.teams.map((t: any, index: number) => {
          const id = t.id ?? t.teamId ?? t.team?.id;
          return { teamId: id, position: index };
        }),
      })),
    };

    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/groups`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Group[]>(res);
  },

  reset: async (tournamentId: string): Promise<void> => {
    await fetch(`${API_URL}/tournaments/${tournamentId}/groups`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  saveScore: async (
    _tournamentId: string,
    _groupId: string,
    matchId: string,
    payload: { score1: number; score2: number; wo?: 1 | 2; sets?: Set[] },
  ): Promise<Group[]> => {
    const res = await fetch(`${API_URL}/matches/${matchId}/score`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const updatedGroup = await handleResponse<Group>(res);
    return [updatedGroup];
  },

  reorderTeams: async (
    tournamentId: string,
    groups: Group[],
  ): Promise<void> => {
    await fetch(`${API_URL}/tournaments/${tournamentId}/groups/reorder`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ groups }),
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENDAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export const ScheduleService = {
  get: async (tournamentId: string): Promise<Record<string, Schedule>> => {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/schedule`, {
      headers: authHeaders(),
    });
    return handleResponse<Record<string, Schedule>>(res);
  },

  update: async (
    _tournamentId: string,
    matchId: string,
    data: Omit<Schedule, "matchId">,
  ): Promise<void> => {
    await fetch(`${API_URL}/matches/${matchId}/schedule`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAYOFFS
// ─────────────────────────────────────────────────────────────────────────────

export interface PlayoffMatchData {
  id: string;
  bracketId: string;
  roundSize: number;
  matchIndex: number;
  team1Id: string | null;
  team2Id: string | null;
  team1Label: string | null;
  team2Label: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  isBye: boolean;
  played: boolean;
}

export interface PlayoffBracketData {
  id: string;
  tournamentId: string;
  category: string;
  matches: PlayoffMatchData[];
}

export const PlayoffService = {
  list: async (tournamentId: string): Promise<PlayoffBracketData[]> => {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/playoffs`, {
      headers: authHeaders(),
    });
    return handleResponse<PlayoffBracketData[]>(res);
  },

  save: async (
    tournamentId: string,
    category: string,
    matches: Omit<PlayoffMatchData, "id" | "bracketId">[],
  ): Promise<PlayoffBracketData> => {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/playoffs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ category, matches }),
    });
    return handleResponse<PlayoffBracketData>(res);
  },

  updateMatch: async (
    matchId: string,
    data: { score1: number; score2: number; winnerId: string },
  ): Promise<PlayoffBracketData> => {
    const res = await fetch(`${API_URL}/playoffs/matches/${matchId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<PlayoffBracketData>(res);
  },

  reset: async (tournamentId: string, category: string): Promise<void> => {
    await fetch(
      `${API_URL}/tournaments/${tournamentId}/playoffs/${encodeURIComponent(category)}`,
      { method: "DELETE", headers: authHeaders() },
    );
  },
};
