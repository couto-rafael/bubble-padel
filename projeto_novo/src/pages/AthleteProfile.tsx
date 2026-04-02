import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AthleteData {
  id: string;
  fullName: string;
  phone?: string;
  city?: string;
  state?: string;
  avatarUrl?: string | null;
  birthDate?: string;
  createdAt: string;
  user?: { email: string };
}

interface TournamentEntry {
  id: string;
  player1Name: string;
  player2Name: string;
  category: string;
  status: string;
  amount: number;
  registrationDate: string;
  tournament: {
    id: string;
    name: string;
    sport: string;
    status: string;
    startDate: string;
    endDate: string;
    categories: string[];
    club: { id: string; name: string; city: string };
  };
}

interface AthleteTrophy {
  id: string;
  tournamentId: string;
  tournamentName: string;
  category: string;
  placement: "CHAMPION" | "RUNNER_UP";
  sport: string;
  earnedAt: string;
}

interface AchievementTierDef {
  tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "LEGEND";
  threshold: number;
  label: string;
}

interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  hasProgress: boolean;
  tiers: AchievementTierDef[];
  currentTier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "LEGEND" | null;
  progress: number;
  unlockedAt: string | null;
  isUnlocked: boolean;
  nextThreshold: number | null;
  nextTierLabel: string | null;
}

interface LeagueStanding {
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

interface AthleteStats {
  trophies: AthleteTrophy[];
  achievements: {
    unlocked: Achievement[];
    inProgress: Achievement[];
    locked: Achievement[];
  };
  leagueStandings: LeagueStanding[];
  summary: {
    totalTrophies: number;
    totalTitles: number;
    totalAchievementsUnlocked: number;
    totalAchievementsAvailable: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const token = () => localStorage.getItem("auth_token") ?? "";
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

async function getProfile(): Promise<AthleteData> {
  const res = await fetch(`${API_URL}/athlete/profile`, {
    headers: authHeaders(),
  });
  return (await res.json()).data;
}

async function getTournaments(): Promise<TournamentEntry[]> {
  const res = await fetch(`${API_URL}/athlete/tournaments`, {
    headers: authHeaders(),
  });
  return (await res.json()).data ?? [];
}

async function getStats(): Promise<AthleteStats | null> {
  try {
    const res = await fetch(`${API_URL}/athlete/stats`, {
      headers: authHeaders(),
    });
    return (await res.json()).data ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeSport(s: string) {
  switch (s?.toUpperCase()) {
    case "PADEL":
      return "Padel";
    case "BEACH_TENNIS":
      return "Beach Tennis";
    case "TENIS":
      return "Tênis";
    default:
      return s;
  }
}

function normalizeStatus(s: string) {
  switch (s?.toUpperCase()) {
    case "CONFIRMED":
      return "Confirmado";
    case "PENDING":
      return "Pendente";
    case "CANCELLED":
      return "Cancelado";
    case "COMPLETED":
      return "Concluído";
    case "ONGOING":
      return "Em Andamento";
    case "OPEN":
      return "Aberto";
    case "PUBLISHED":
      return "Em Breve";
    default:
      return s;
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "AT"
  );
}

function generateHeatmap(entries: TournamentEntry[]) {
  const today = new Date();
  const activeDates = new Set(
    entries.map((e) => new Date(e.tournament.startDate).toDateString()),
  );
  return Array.from({ length: 84 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (83 - i));
    const active = activeDates.has(date.toDateString());
    return { date, intensity: active ? Math.floor(Math.random() * 3) + 2 : 0 };
  });
}

const INTENSITY_COLORS = [
  "bg-gray-100",
  "bg-green-200",
  "bg-green-400",
  "bg-green-500",
  "bg-green-600",
];

const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  BRONZE: {
    label: "Bronze",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  SILVER: {
    label: "Prata",
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
  },
  GOLD: {
    label: "Ouro",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
  },
  DIAMOND: {
    label: "Diamante",
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-200",
  },
  LEGEND: {
    label: "Lenda",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  participacao: "Participação",
  performance: "Performance",
  social: "Social",
  plataforma: "Plataforma",
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const TrophyCard = ({ trophy }: { trophy: AthleteTrophy }) => (
  <div
    className={`text-center p-5 rounded-xl border ${
      trophy.placement === "CHAMPION"
        ? "bg-gradient-to-b from-yellow-50 to-white border-yellow-200"
        : "bg-gradient-to-b from-gray-50 to-white border-gray-200"
    }`}
  >
    <span className="text-4xl block mb-2">
      {trophy.placement === "CHAMPION" ? "🥇" : "🥈"}
    </span>
    <p
      className={`text-xs font-bold uppercase tracking-wide mb-1 ${
        trophy.placement === "CHAMPION" ? "text-yellow-600" : "text-gray-400"
      }`}
    >
      {trophy.placement === "CHAMPION" ? "Campeão" : "Vice-campeão"}
    </p>
    <p className="text-sm font-bold text-gray-800 leading-tight">
      {trophy.tournamentName}
    </p>
    <p className="text-xs text-gray-500 mt-1">{trophy.category}</p>
    <p className="text-xs text-gray-400 mt-0.5">
      {normalizeSport(trophy.sport)}
    </p>
    <p className="text-xs text-gray-300 mt-2">{formatDate(trophy.earnedAt)}</p>
  </div>
);

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const tier = achievement.currentTier;
  const tierCfg = tier ? TIER_CONFIG[tier] : null;
  const pct =
    achievement.hasProgress &&
    achievement.nextThreshold &&
    achievement.progress > 0
      ? Math.min((achievement.progress / achievement.nextThreshold) * 100, 100)
      : 0;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        achievement.isUnlocked
          ? `${tierCfg?.bg ?? "bg-white border-gray-200"}`
          : "bg-white border-gray-100 opacity-60"
      }`}
    >
      <span
        className={`text-3xl flex-shrink-0 ${!achievement.isUnlocked ? "grayscale" : ""}`}
      >
        {achievement.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p
            className={`font-semibold text-sm ${achievement.isUnlocked ? "text-gray-900" : "text-gray-400"}`}
          >
            {achievement.name}
          </p>
          {tierCfg && achievement.isUnlocked && (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded ${tierCfg.color} ${tierCfg.bg} border`}
            >
              {tierCfg.label}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{achievement.description}</p>

        {/* Barra de progresso */}
        {achievement.hasProgress &&
          !achievement.isUnlocked &&
          achievement.nextThreshold && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>
                  {achievement.progress} / {achievement.nextThreshold}
                </span>
                <span>{achievement.nextTierLabel}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-green-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

        {/* Progresso para próximo tier (já desbloqueado, mas tem tier acima) */}
        {achievement.hasProgress &&
          achievement.isUnlocked &&
          achievement.nextThreshold && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>
                  {achievement.progress} / {achievement.nextThreshold}
                </span>
                <span className="text-gray-400">
                  Próximo: {achievement.nextTierLabel}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-blue-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

        {achievement.isUnlocked && achievement.unlockedAt && (
          <p className="text-xs text-gray-300 mt-1">
            Desbloqueado em {formatDate(achievement.unlockedAt)}
          </p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AthleteProfile: React.FC = () => {
  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [tournaments, setTournaments] = useState<TournamentEntry[]>([]);
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tournaments" | "trophies" | "leagues"
  >("overview");
  const [achievementFilter, setAchievementFilter] = useState<
    "all" | "unlocked" | "inProgress"
  >("all");

  useEffect(() => {
    Promise.all([getProfile(), getTournaments(), getStats()])
      .then(([profile, tourns, athleteStats]) => {
        setAthlete(profile);
        setTournaments(tourns);
        setStats(athleteStats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AthleteHeader />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AthleteHeader />
        <div className="pt-24 text-center text-gray-500">
          Erro ao carregar perfil.
        </div>
      </div>
    );
  }

  const heatmap = generateHeatmap(tournaments);
  const totalTournaments = tournaments.length;
  const confirmedTournaments = tournaments.filter(
    (t) => t.status === "CONFIRMED",
  ).length;
  const location =
    [athlete.city, athlete.state].filter(Boolean).join(", ") || "—";
  const memberSince = new Date(athlete.createdAt).getFullYear();

  // Stats vindos da API (com fallback 0 se ainda não processado)
  const totalTrophies = stats?.summary.totalTrophies ?? 0;
  const totalTitles = stats?.summary.totalTitles ?? 0;
  const achievUnlocked = stats?.summary.totalAchievementsUnlocked ?? 0;
  const achievTotal = stats?.summary.totalAchievementsAvailable ?? 0;
  const trophies = stats?.trophies ?? [];
  const leagueStandings = stats?.leagueStandings ?? [];

  // Achievements agrupados por categoria para exibição
  const allAchievements = [
    ...(stats?.achievements.unlocked ?? []),
    ...(stats?.achievements.inProgress ?? []),
    ...(stats?.achievements.locked ?? []),
  ];

  const filteredAchievements =
    achievementFilter === "unlocked"
      ? (stats?.achievements.unlocked ?? [])
      : achievementFilter === "inProgress"
        ? (stats?.achievements.inProgress ?? [])
        : allAchievements;

  const achievementsByCategory = filteredAchievements.reduce(
    (acc, a) => {
      const cat = a.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    },
    {} as Record<string, Achievement[]>,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AthleteHeader />

      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* ── Hero Card ──────────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
            <div className="h-24 bg-gradient-to-r from-[#1a1f4a] to-[#0f1540]" />
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="w-20 h-20 rounded-xl border-4 border-white bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden shadow-lg">
                  {athlete.avatarUrl ? (
                    <img
                      src={athlete.avatarUrl}
                      alt={athlete.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-white">
                      {getInitials(athlete.fullName)}
                    </span>
                  )}
                </div>
                <Link
                  to="/athlete/settings"
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Editar Perfil
                </Link>
              </div>

              <h1 className="text-2xl font-black text-gray-900 mb-1">
                {athlete.fullName}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                {location !== "—" && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Membro desde {memberSince}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100 flex-wrap">
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900">
                    {totalTournaments}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Torneios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600">
                    {confirmedTournaments}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Confirmados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-yellow-500">
                    {totalTitles}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Títulos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-600">
                    {totalTrophies}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Troféus</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600">
                    {achievUnlocked}
                    <span className="text-sm text-gray-300">
                      /{achievTotal}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Conquistas</div>
                </div>
                {leagueStandings.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-black text-orange-500">
                      #{leagueStandings[0].rankPosition ?? "—"}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 max-w-[72px] truncate">
                      {leagueStandings[0].league.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 overflow-x-auto">
            {(
              [
                { id: "overview", label: "Visão Geral" },
                { id: "tournaments", label: "Torneios" },
                {
                  id: "trophies",
                  label: `Troféus ${totalTrophies > 0 ? `(${totalTrophies})` : ""}`,
                },
                {
                  id: "leagues",
                  label: `Ligas ${leagueStandings.length > 0 ? `(${leagueStandings.length})` : ""}`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#1a1f4a] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Visão Geral ─────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Heatmap */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Atividade nos Últimos 3 Meses
                </h2>
                <div className="flex gap-1 flex-wrap">
                  {heatmap.map((day, i) => (
                    <div
                      key={i}
                      title={day.date.toLocaleDateString("pt-BR")}
                      className={`w-3 h-3 rounded-sm ${INTENSITY_COLORS[day.intensity]}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <span>Menos</span>
                  {INTENSITY_COLORS.map((c, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                  ))}
                  <span>Mais</span>
                </div>
              </div>

              {/* Últimos torneios */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Últimos Torneios
                </h2>
                {tournaments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Ainda sem torneios inscritos.</p>
                    <Link
                      to="/tournaments"
                      className="text-green-600 hover:underline text-sm mt-2 inline-block"
                    >
                      Ver torneios disponíveis →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tournaments.slice(0, 5).map((entry) => (
                      <Link
                        key={entry.id}
                        to={`/tournaments/${entry.tournament.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {entry.tournament.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {entry.tournament.club.name} · {entry.category} ·{" "}
                            {normalizeSport(entry.tournament.sport)}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            entry.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : entry.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {normalizeStatus(entry.status)}
                        </span>
                      </Link>
                    ))}
                    {tournaments.length > 5 && (
                      <button
                        onClick={() => setActiveTab("tournaments")}
                        className="text-sm text-green-600 hover:underline w-full text-center pt-1"
                      >
                        Ver todos os {tournaments.length} torneios →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Conquistas recentes */}
              {(stats?.achievements.unlocked ?? []).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">
                      Conquistas Recentes
                    </h2>
                    <button
                      onClick={() => setActiveTab("trophies")}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Ver todas →
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {stats!.achievements.unlocked.slice(0, 4).map((a) => (
                      <div
                        key={a.key}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <span className="text-xl">{a.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {a.name}
                          </p>
                          {a.currentTier && (
                            <p
                              className={`text-xs font-bold ${TIER_CONFIG[a.currentTier].color}`}
                            >
                              {TIER_CONFIG[a.currentTier].label}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Torneios ────────────────────────────────────────────── */}
          {activeTab === "tournaments" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Histórico de Torneios ({totalTournaments})
              </h2>
              {tournaments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 opacity-30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-sm">Ainda sem torneios inscritos.</p>
                  <Link
                    to="/tournaments"
                    className="text-green-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Ver torneios disponíveis →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tournaments.map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/tournaments/${entry.tournament.id}`}
                      className="block p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {normalizeSport(entry.tournament.sport)}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                entry.tournament.status === "COMPLETED"
                                  ? "bg-purple-100 text-purple-700"
                                  : entry.tournament.status === "ONGOING"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {normalizeStatus(entry.tournament.status)}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">
                            {entry.tournament.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {entry.tournament.club.name} · {entry.category}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Parceiro:{" "}
                            {entry.player1Name === athlete.fullName
                              ? entry.player2Name
                              : entry.player1Name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              entry.status === "CONFIRMED"
                                ? "bg-green-100 text-green-700"
                                : entry.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {normalizeStatus(entry.status)}
                          </span>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(entry.registrationDate)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Troféus & Conquistas ─────────────────────────────────── */}
          {activeTab === "trophies" && (
            <div className="space-y-6">
              {/* Troféus */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-gray-900 mb-6">
                  Sala de Troféus
                </h2>
                {trophies.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <span className="text-5xl block mb-3">🏆</span>
                    <p className="text-sm font-medium text-gray-600">
                      Ainda sem troféus
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Chegue à final de um torneio para conquistar seu primeiro
                      troféu
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {trophies.map((trophy) => (
                      <TrophyCard key={trophy.id} trophy={trophy} />
                    ))}
                  </div>
                )}
              </div>

              {/* Conquistas */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-base font-bold text-gray-900">
                    Conquistas ({achievUnlocked}/{achievTotal})
                  </h2>
                  {/* Filtros */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {(
                      [
                        { key: "all", label: "Todas" },
                        {
                          key: "unlocked",
                          label: `Desbloqueadas (${stats?.achievements.unlocked.length ?? 0})`,
                        },
                        {
                          key: "inProgress",
                          label: `Em progresso (${stats?.achievements.inProgress.length ?? 0})`,
                        },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setAchievementFilter(f.key)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          achievementFilter === f.key
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredAchievements.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Nenhuma conquista neste filtro.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(achievementsByCategory).map(
                      ([cat, list]) => (
                        <div key={cat}>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                            {CATEGORY_LABELS[cat] ?? cat}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {list.map((a) => (
                              <AchievementCard key={a.key} achievement={a} />
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Ligas ───────────────────────────────────────────────── */}
          {activeTab === "leagues" && (
            <div className="space-y-4">
              {leagueStandings.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                  <span className="text-4xl block mb-3">🏆</span>
                  <p className="text-sm font-medium text-gray-600">
                    Nenhuma liga ainda
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Participe de torneios vinculados a ligas para aparecer aqui
                  </p>
                </div>
              ) : (
                leagueStandings.map((standing) => {
                  // Agrupa entries por categoria
                  const byCategory = standing.entries.reduce(
                    (acc, e) => {
                      if (!acc[e.category])
                        acc[e.category] = { points: 0, entries: [] };
                      acc[e.category].points += e.points;
                      acc[e.category].entries.push(e);
                      return acc;
                    },
                    {} as Record<
                      string,
                      { points: number; entries: typeof standing.entries }
                    >,
                  );
                  const categories = Object.keys(byCategory).sort();

                  return (
                    <div
                      key={standing.league.id}
                      className="bg-white border border-gray-200 rounded-xl p-6"
                    >
                      {/* Header da liga */}
                      <div className="flex items-center gap-2 mb-5">
                        <span className="text-lg">🏆</span>
                        <h3 className="font-bold text-gray-900">
                          {standing.league.name}
                        </h3>
                        {standing.league.sport && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                            {normalizeSport(standing.league.sport)}
                          </span>
                        )}
                      </div>

                      {/* Pontos por categoria — sempre separado */}
                      <div className="space-y-4">
                        {categories.map((cat) => {
                          const catData = byCategory[cat];
                          return (
                            <div
                              key={cat}
                              className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                  {cat}
                                </p>
                                <div className="text-right">
                                  <span className="text-xl font-black text-gray-900">
                                    {catData.points}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-1">
                                    pts
                                  </span>
                                </div>
                              </div>
                              {/* Detalhes por torneio nesta categoria */}
                              <div className="space-y-1.5">
                                {catData.entries.map((entry, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">
                                        {entry.placement === "champion"
                                          ? "🥇"
                                          : entry.placement === "runner_up"
                                            ? "🥈"
                                            : entry.placement === "semi"
                                              ? "🥉"
                                              : "▸"}
                                      </span>
                                      <span className="text-gray-500 text-xs capitalize">
                                        {entry.placement.replace("_", " ")}
                                      </span>
                                    </div>
                                    <span className="font-semibold text-gray-700">
                                      +{entry.points} pts
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AthleteProfile;
