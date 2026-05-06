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
      const token = localStorage.getItem("auth_token");
      const raw = localStorage.getItem("auth_user");
      if (!token || !raw) return null;
      return JSON.parse(raw);
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
    matchDuration: t.matchDuration ?? 60,
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

  syncStatus: async (id: string): Promise<{ status: string }> => {
    const res = await fetch(`${API_URL}/tournaments/${id}/sync-status`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handleResponse<{ status: string }>(res);
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

  bulkUpdate: async (
    tournamentId: string,
    schedules: Array<{
      matchId: string;
      court: string;
      date: string;
      time: string;
    }>,
  ): Promise<void> => {
    const res = await fetch(
      `${API_URL}/tournaments/${tournamentId}/schedule/bulk`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ schedules }),
      },
    );
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
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

  seed: async (
    tournamentId: string,
    category: string,
  ): Promise<PlayoffBracketData> => {
    const res = await fetch(
      `${API_URL}/tournaments/${tournamentId}/playoffs/${encodeURIComponent(category)}/seed`,
      { method: "POST", headers: authHeaders() },
    );
    return handleResponse<PlayoffBracketData>(res);
  },
};

// ─── Public Club Service ──────────────────────────────────────────────────────

export interface PublicClub {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  logoUrl: string | null;
  courts: string[];
  tournaments: Array<{
    id: string;
    name: string;
    sport: string;
    status: string;
    startDate: string;
    endDate: string;
    categories: string[];
    priceFirstCategory: number;
    _count: { teams: number };
  }>;
}

export const PublicClubService = {
  get: async (id: string): Promise<PublicClub> => {
    const res = await fetch(`${API_URL}/public/clubs/${id}`);
    return handleResponse<PublicClub>(res);
  },
};

// ─── Public Tournament Service ────────────────────────────────────────────────

export interface PublicTournament {
  id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  categories: string[];
  priceFirstCategory: number;
  maxTeams: number;
  description?: string;
  clubSede?: string;
  clubId: string;
  courts?: string[];
  daySchedules?: Array<{ date: string; startTime: string; endTime: string }>;
  club?: {
    id?: string;
    name: string;
    city: string | null;
    state: string | null;
    phone: string | null;
    logoUrl: string | null;
  };
  _count?: { teams: number };
  totalTeams?: number;
  teams?: Array<{
    id: string;
    player1Name: string;
    player1Email?: string;
    player2Name: string;
    player2Email?: string;
    category: string;
    status: string;
    player1AthleteId?: string | null;
    player2AthleteId?: string | null;
  }>;
  groups?: Array<{
    id: string;
    name: string;
    category: string;
    teams: Array<{
      team: {
        id: string;
        player1Name: string;
        player2Name: string;
        player1AthleteId?: string | null;
        player2AthleteId?: string | null;
      };
    }>;
    matches: Array<{
      id: string;
      team1Id: string | null;
      team2Id: string | null;
      score1: number | null;
      score2: number | null;
      played: boolean;
      schedule: {
        court: string;
        date: string | null;
        time: string | null;
      } | null;
    }>;
  }>;
  playoffBrackets?: Array<{
    id: string;
    category: string;
    matches: Array<{
      id: string;
      roundSize: number;
      matchIndex: number;
      team1Id: string | null;
      team2Id: string | null;
      team1Label: string | null;
      team2Label: string | null;
      score1: number | null;
      score2: number | null;
      winnerId: string | null;
      played: boolean;
    }>;
  }>;
}

export const PublicTournamentService = {
  list: async (): Promise<PublicTournament[]> => {
    const res = await fetch(`${API_URL}/public/tournaments`);
    return handleResponse<PublicTournament[]>(res);
  },

  get: async (id: string): Promise<PublicTournament> => {
    const res = await fetch(`${API_URL}/public/tournaments/${id}`);
    return handleResponse<PublicTournament>(res);
  },

  getSuper8: async (id: string): Promise<{ players: any[]; matches: any[] }> => {
    const res = await fetch(`${API_URL}/super8/${id}`);
    const data = await handleResponse<{ players: any[]; matches: any[] }>(res);
    return data;
  },

  register: async (
    id: string,
    data: {
      player1Name: string;
      player1Email: string;
      player2Name: string;
      player2Email: string;
      category: string;
      athleteId?: string;
    },
  ): Promise<{ id: string }> => {
    const res = await fetch(`${API_URL}/public/tournaments/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ id: string }>(res);
  },
};

// ─── Public Athlete Service ───────────────────────────────────────────────────

export interface PublicAthleteTrophy {
  tournamentId: string;
  tournamentName: string;
  category: string;
  position: 1 | 2;
  date: string;
}

export interface PublicAthlete {
  id: string;
  fullName: string;
  nickname?: string | null;
  city?: string | null;
  state?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  sports: string[];
  rackets: string[];
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  createdAt: string;
  // 8.P1 additions
  isFollowersOnly?: boolean;
  trophies?: PublicAthleteTrophy[];
  stats?: { totalMatches: number; wins: number; winRate: number | null } | null;
  sponsors?: Array<{ id: string; name: string; logoUrl?: string | null; websiteUrl?: string | null }>;
}

export const PublicAthleteService = {
  get: async (id: string): Promise<PublicAthlete> => {
    const res = await fetch(`${API_URL}/public/athletes/${id}`);
    return handleResponse<PublicAthlete>(res);
  },
};

// ─── Athlete View Service (autenticado — ver perfil de outro atleta) ──────────

export interface AthleteViewEntry {
  id: string;
  player1Name: string;
  player2Name: string;
  category: string;
  status: string;
  registrationDate: string;
  tournament: {
    id: string;
    name: string;
    sport: string;
    status: string;
    startDate: string;
    endDate: string;
    club: { name: string; city: string };
  };
}

interface AthleteTrophyView {
  id: string;
  tournamentId: string;
  tournamentName: string;
  category: string;
  placement: "CHAMPION" | "RUNNER_UP";
  sport: string;
  earnedAt: string;
}

interface AchievementView {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  hasProgress: boolean;
  tiers: Array<{ tier: string; threshold: number; label: string }>;
  currentTier: string | null;
  progress: number;
  unlockedAt: string | null;
  isUnlocked: boolean;
  nextThreshold: number | null;
  nextTierLabel: string | null;
}

interface LeagueStandingView {
  league: { id: string; name: string; sport: string | null };
  totalPoints: number;
  rankPosition: number | null;
  entries: Array<{
    tournamentId: string;
    category: string;
    placement: string;
    points: number;
    earnedAt: string;
  }>;
}

export interface AthleteView extends Omit<PublicAthlete, "trophies" | "stats"> {
  tournaments: AthleteViewEntry[];
  sponsors: Array<{ id: string; name: string; logoUrl?: string | null; websiteUrl?: string | null }>;
  trophies: AthleteTrophyView[];
  achievements: {
    unlocked: AchievementView[];
    inProgress: AchievementView[];
    locked: AchievementView[];
  };
  leagueStandings: LeagueStandingView[];
  matchStats: {
    wins: number;
    losses: number;
    totalMatches: number;
    winRate: number;
    topPartners: Array<{ name: string; wins: number; losses: number; total: number; winRate: number }>;
    byCategory: Array<{ category: string; wins: number; losses: number; total: number; winRate: number }>;
  };
  summary: {
    totalTrophies: number;
    totalTitles: number;
    totalAchievementsUnlocked: number;
    totalAchievementsAvailable: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export const AthleteViewService = {
  get: async (id: string): Promise<AthleteView> => {
    const res = await fetch(`${API_URL}/athlete/view/${id}`, {
      headers: authHeaders(),
    });
    return handleResponse<AthleteView>(res);
  },
};
