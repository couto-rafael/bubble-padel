// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UNIFICADOS DO PROJETO
// Fonte única de verdade para todas as interfaces.
// Importar sempre de "@/types" (com path alias configurado no vite.config.ts)
// ─────────────────────────────────────────────────────────────────────────────

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export type UserType = "club" | "athlete" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatarUrl?: string;
  createdAt: string;
}

export interface Club {
  id: string;
  userId: string;
  name: string;
  cnpj?: string;
  city: string;
  state: string;
  phone?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Athlete {
  id: string;
  userId: string;
  fullName: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── TORNEIO ──────────────────────────────────────────────────────────────────

export type TournamentStatus = "draft" | "published" | "ongoing" | "completed";
export type Sport = "Padel" | "Beach Tennis" | "Tenis" | "Pickleball";

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  tournamentType: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  description: string;
  status: TournamentStatus;
  maxTeams: number;
  totalTeams: number;
  priceFirstCategory: number;
  hasSecondCategoryPrice: boolean;
  priceSecondCategory: number;
  pixKey: string;
  clubSede: string;
  categories: string[];
  courts: string[]; // quadras do torneio
  matchDuration: number;
  daySchedules: Array<{ date: string; startTime: string; endTime: string }>;
  clubId?: string; // FK para o clube organizador
  createdAt: string;
  updatedAt: string;
}

// ─── INSCRIÇÕES ───────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  tournamentId: string; // FK para o torneio
  player1Name: string;
  player1Email: string;
  player2Name: string;
  player2Email: string;
  category: string;
  status: "confirmed" | "pending";
  paymentStatus: "paid" | "pending";
  registrationDate: string;
  amount: number;
  hasRestriction: boolean;
}

// ─── GRUPOS ───────────────────────────────────────────────────────────────────

export interface Set {
  s1: number;
  s2: number;
}

export interface Match {
  id: string;
  groupId: string; // FK para o grupo
  team1Id: string;
  team2Id: string;
  score1: number | null;
  score2: number | null;
  played: boolean;
  wo?: 1 | 2; // 1 = team1 venceu por WO, 2 = team2 venceu por WO
  sets?: Set[]; // resultado por sets
}

export interface GroupTeam {
  team: Team;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  saldo: number;
  gamesPlayed: number;
  qualified: boolean;
}

export interface Group {
  id: string;
  tournamentId: string; // FK para o torneio
  name: string; // "Grupo A", "Grupo B", ...
  category: string;
  teams: GroupTeam[];
  matches: Match[];
}

// ─── AGENDAMENTO ──────────────────────────────────────────────────────────────

export interface Schedule {
  matchId: string;
  court: string;
  date: string; // ISO "2025-03-15"
  time: string; // "14:00"
}

// ─── PLAYOFFS (futuro) ────────────────────────────────────────────────────────

export interface PlayoffMatch {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  team1Id: string | null;
  team2Id: string | null;
  score1: number | null;
  score2: number | null;
  played: boolean;
  sets?: Set[];
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────
// Padrão de resposta que o backend deve seguir

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
