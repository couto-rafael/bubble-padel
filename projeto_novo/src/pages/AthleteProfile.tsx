import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

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

// ─── API ──────────────────────────────────────────────────────────────────────

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

// ─── HELPERS (preservados) ────────────────────────────────────────────────────

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
  "bg-[#00e87a]/20",
  "bg-[#00e87a]/40",
  "bg-[#00e87a]/70",
  "bg-[#00e87a]",
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

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────

const TrophyCard = ({ trophy }: { trophy: AthleteTrophy }) => (
  <div
    className={`text-center p-5 rounded-2xl border relative overflow-hidden ${
      trophy.placement === "CHAMPION"
        ? "bg-gradient-to-b from-amber-50 to-white border-amber-200"
        : "bg-gradient-to-b from-gray-50 to-white border-gray-200"
    }`}
  >
    {trophy.placement === "CHAMPION" && (
      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
    )}
    <span className="text-4xl block mb-2">
      {trophy.placement === "CHAMPION" ? "🏆" : "🥈"}
    </span>
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${
        trophy.placement === "CHAMPION"
          ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {trophy.placement === "CHAMPION" ? "🥇 Campeão" : "🥈 Vice"}
    </span>
    <p className="text-[13px] font-bold text-gray-900 leading-tight mb-1">
      {trophy.tournamentName}
    </p>
    <p className="text-[11px] text-gray-500">{trophy.category}</p>
    <p className="text-[11px] text-gray-400">{normalizeSport(trophy.sport)}</p>
    <p className="text-[10px] text-gray-300 mt-2">
      {formatDate(trophy.earnedAt)}
    </p>
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
          : "bg-white border-gray-100 opacity-50"
      }`}
    >
      <span
        className={`text-2xl flex-shrink-0 mt-0.5 ${!achievement.isUnlocked ? "grayscale" : ""}`}
      >
        {achievement.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p
            className={`font-bold text-[13px] ${achievement.isUnlocked ? "text-gray-900" : "text-gray-400"}`}
          >
            {achievement.name}
          </p>
          {tierCfg && achievement.isUnlocked && (
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${tierCfg.color} ${tierCfg.bg}`}
            >
              {tierCfg.label}
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-400 font-normal">
          {achievement.description}
        </p>

        {achievement.hasProgress &&
          !achievement.isUnlocked &&
          achievement.nextThreshold && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                <span>
                  {achievement.progress} / {achievement.nextThreshold}
                </span>
                <span className="font-semibold">
                  {achievement.nextTierLabel}
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00e87a] to-[#00c8ff] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

        {achievement.hasProgress &&
          achievement.isUnlocked &&
          achievement.nextThreshold && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                <span>
                  {achievement.progress} / {achievement.nextThreshold}
                </span>
                <span className="font-semibold">
                  Próximo: {achievement.nextTierLabel}
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-[#00c8ff] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

        {achievement.isUnlocked && achievement.unlockedAt && (
          <p className="text-[11px] text-gray-300 mt-1.5">
            Desbloqueado em {formatDate(achievement.unlockedAt)}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

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

  const { pathname } = useLocation();

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
      <div className="min-h-screen bg-[#f8f9fc]">
        <AthleteHeader />
        <div className="pt-24 flex items-center justify-center">
          <span className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin inline-block" />
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <AthleteHeader />
        <div className="pt-24 text-center text-gray-500 text-sm">
          Erro ao carregar perfil.
        </div>
      </div>
    );
  }

  // ── Derivações (preservadas) ──────────────────────────────────────────────

  const heatmap = generateHeatmap(tournaments);
  const totalTournaments = tournaments.length;
  const confirmedTournaments = tournaments.filter(
    (t) => t.status === "CONFIRMED",
  ).length;
  const location =
    [athlete.city, athlete.state].filter(Boolean).join(", ") || "—";
  const memberSince = new Date(athlete.createdAt).getFullYear();

  const totalTrophies = stats?.summary.totalTrophies ?? 0;
  const totalTitles = stats?.summary.totalTitles ?? 0;
  const achievUnlocked = stats?.summary.totalAchievementsUnlocked ?? 0;
  const achievTotal = stats?.summary.totalAchievementsAvailable ?? 0;
  const trophies = stats?.trophies ?? [];
  const leagueStandings = stats?.leagueStandings ?? [];

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
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    },
    {} as Record<string, Achievement[]>,
  );

  const TABS = [
    { id: "overview" as const, label: "Visão Geral" },
    {
      id: "tournaments" as const,
      label: `Torneios${totalTournaments > 0 ? ` (${totalTournaments})` : ""}`,
    },
    {
      id: "trophies" as const,
      label: `Troféus${totalTrophies > 0 ? ` (${totalTrophies})` : ""}`,
    },
    {
      id: "leagues" as const,
      label: `Ligas${leagueStandings.length > 0 ? ` (${leagueStandings.length})` : ""}`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-12">
        {/* ── Hero Card ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-5">
          <div className="h-16 bg-gradient-to-r from-[#00e87a]/10 via-[#00c8ff]/5 to-[#00e87a]/10" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-9 mb-4">
              <div className="w-16 h-16 rounded-2xl border-[3px] border-white bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(0,232,122,0.3)]">
                {athlete.avatarUrl ? (
                  <img
                    src={athlete.avatarUrl}
                    alt={athlete.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-extrabold text-[#0a0e1a]">
                    {getInitials(athlete.fullName)}
                  </span>
                )}
              </div>
              <Link
                to="/athlete/settings"
                className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Editar Perfil
              </Link>
            </div>

            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-1.5">
              {athlete.fullName}
            </h1>
            <div className="flex flex-wrap gap-3 text-[12px] text-gray-500 mb-4 font-normal">
              {location !== "—" && <span>📍 {location}</span>}
              <span>📅 Membro desde {memberSince}</span>
              {athlete.user?.email && (
                <span className="hidden sm:inline">
                  ✉️ {athlete.user.email}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
              {[
                {
                  value: totalTournaments,
                  label: "Torneios",
                  color: "text-gray-900",
                },
                {
                  value: totalTrophies,
                  label: "Troféus",
                  color: "text-amber-600",
                },
                {
                  value: "—",
                  label: "% Aproveit.",
                  color: "text-blue-600",
                  title: "Disponível em breve",
                },
                {
                  value: achievUnlocked,
                  label: "Badges",
                  color: "text-purple-600",
                },
              ].map(({ value, label, color, title }) => (
                <div key={label} className="text-center" title={title}>
                  <p
                    className={`text-[20px] font-extrabold tracking-tight leading-none ${color}`}
                  >
                    {value}
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wide">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px transition-all duration-150 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Visão Geral ──────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-[14px] font-extrabold text-gray-900 mb-4 tracking-tight">
                Atividade — Últimos 3 Meses
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
              <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-400">
                <span>Menos</span>
                {INTENSITY_COLORS.map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
                <span>Mais</span>
              </div>
            </div>

            {/* Estatísticas detalhadas — placeholder Sprint 7.S1 */}
            <div className="bg-gradient-to-br from-[#0a0e1a] to-[#141824] border border-white/[0.08] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-extrabold text-[#f0f4ff] tracking-tight">
                  Estatísticas Detalhadas
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00e87a]/10 text-[#00e87a] border border-[#00e87a]/20">
                  Em breve
                </span>
              </div>
              <p className="text-[12px] text-[#6b7a99] mb-4 font-normal leading-relaxed">
                Vitórias, derrotas, % de aproveitamento, melhores parceiros e
                adversários mais frequentes.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {["Vitórias", "Derrotas", "% Aproveit."].map((label) => (
                  <div
                    key={label}
                    className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center"
                  >
                    <div className="h-5 bg-white/[0.06] rounded-md mb-2 animate-pulse" />
                    <p className="text-[10px] font-semibold text-[#6b7a99] uppercase tracking-wide">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                  Últimos Torneios
                </h2>
                {tournaments.length > 5 && (
                  <button
                    onClick={() => setActiveTab("tournaments")}
                    className="text-blue-600 text-[12px] font-bold hover:text-blue-700 transition-colors"
                  >
                    Ver todos →
                  </button>
                )}
              </div>
              {tournaments.length === 0 ? (
                <div className="flex flex-col items-center text-center px-6 py-10">
                  <span className="text-3xl mb-3 opacity-40">🎾</span>
                  <p className="text-[13px] font-bold text-gray-700 mb-1">
                    Ainda sem torneios
                  </p>
                  <Link
                    to="/tournaments"
                    className="text-blue-600 text-[12px] font-semibold hover:underline mt-1"
                  >
                    Ver torneios disponíveis →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tournaments.slice(0, 5).map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/tournaments/${entry.tournament.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-[13px] truncate">
                          {entry.tournament.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 font-normal">
                          {entry.tournament.club.name} · {entry.category} ·{" "}
                          {normalizeSport(entry.tournament.sport)}
                        </p>
                      </div>
                      <span
                        className={`ml-3 text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          entry.status === "CONFIRMED"
                            ? "bg-green-50 text-green-700"
                            : entry.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {normalizeStatus(entry.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {(stats?.achievements.unlocked ?? []).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    Conquistas Recentes
                  </h2>
                  <button
                    onClick={() => setActiveTab("trophies")}
                    className="text-blue-600 text-[12px] font-bold hover:text-blue-700 transition-colors"
                  >
                    Ver todas →
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats!.achievements.unlocked.slice(0, 4).map((a) => (
                    <div
                      key={a.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                        a.currentTier
                          ? TIER_CONFIG[a.currentTier].bg
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <span className="text-lg">{a.icon}</span>
                      <div>
                        <p className="font-bold text-gray-900 text-[12px]">
                          {a.name}
                        </p>
                        {a.currentTier && (
                          <p
                            className={`text-[10px] font-extrabold ${TIER_CONFIG[a.currentTier].color}`}
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

        {/* ── Tab: Torneios ─────────────────────────────────────────────────── */}
        {activeTab === "tournaments" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                Histórico de Torneios ({totalTournaments})
              </h2>
            </div>
            {tournaments.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center px-6">
                <span className="text-4xl mb-3 opacity-40">📋</span>
                <p className="text-[13px] font-bold text-gray-700 mb-1">
                  Nenhum torneio ainda
                </p>
                <Link
                  to="/tournaments"
                  className="text-blue-600 text-[12px] font-semibold hover:underline mt-1"
                >
                  Ver torneios disponíveis →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {tournaments.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/tournaments/${entry.tournament.id}`}
                    className="block px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {normalizeSport(entry.tournament.sport)}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              entry.tournament.status === "COMPLETED"
                                ? "bg-purple-50 text-purple-700"
                                : entry.tournament.status === "ONGOING"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {normalizeStatus(entry.tournament.status)}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 text-[14px]">
                          {entry.tournament.name}
                        </p>
                        <p className="text-[12px] text-gray-500 mt-0.5 font-normal">
                          {entry.tournament.club.name} · {entry.category}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 font-normal">
                          Parceiro:{" "}
                          {entry.player1Name === athlete.fullName
                            ? entry.player2Name
                            : entry.player1Name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            entry.status === "CONFIRMED"
                              ? "bg-green-50 text-green-700"
                              : entry.status === "PENDING"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {normalizeStatus(entry.status)}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-2">
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

        {/* ── Tab: Troféus & Conquistas ──────────────────────────────────────── */}
        {activeTab === "trophies" && (
          <div className="space-y-4">
            <div className="bg-[#0a0e1a] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h2 className="text-[14px] font-extrabold text-[#f0f4ff] tracking-tight">
                  Sala de Troféus
                </h2>
                {totalTrophies > 0 && (
                  <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#00e87a]/10 text-[#00e87a] border border-[#00e87a]/20">
                    {totalTrophies} troféus
                  </span>
                )}
              </div>
              <div className="p-5">
                {trophies.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-10">
                    <span className="text-5xl block mb-3 opacity-30">🏆</span>
                    <p className="text-[14px] font-bold text-[#f0f4ff] mb-1">
                      Ainda sem troféus
                    </p>
                    <p className="text-[12px] text-[#6b7a99] font-normal">
                      Chegue à final de um torneio para conquistar seu primeiro
                      troféu
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {trophies.map((trophy) => (
                      <TrophyCard key={trophy.id} trophy={trophy} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                  Conquistas ({achievUnlocked}/{achievTotal})
                </h2>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {[
                    { key: "all" as const, label: "Todas" },
                    {
                      key: "unlocked" as const,
                      label: `Desbloqueadas (${stats?.achievements.unlocked.length ?? 0})`,
                    },
                    {
                      key: "inProgress" as const,
                      label: `Em progresso (${stats?.achievements.inProgress.length ?? 0})`,
                    },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setAchievementFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
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
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhuma conquista neste filtro.
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(achievementsByCategory).map(([cat, list]) => (
                    <div key={cat}>
                      <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {list.map((a) => (
                          <AchievementCard key={a.key} achievement={a} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Ligas ────────────────────────────────────────────────────── */}
        {activeTab === "leagues" && (
          <div className="space-y-4">
            {leagueStandings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 flex flex-col items-center text-center">
                <span className="text-5xl mb-3 opacity-40">🏅</span>
                <p className="text-[15px] font-extrabold text-gray-800 mb-1.5">
                  Nenhuma liga ainda
                </p>
                <p className="text-[13px] text-gray-500 font-normal">
                  Participe de torneios vinculados a ligas para aparecer aqui
                </p>
              </div>
            ) : (
              leagueStandings.map((standing) => {
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
                    className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                      <span className="text-lg">🏆</span>
                      <h3 className="font-extrabold text-gray-900 text-[15px] tracking-tight">
                        {standing.league.name}
                      </h3>
                      {standing.league.sport && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full">
                          {normalizeSport(standing.league.sport)}
                        </span>
                      )}
                      {standing.rankPosition && (
                        <span className="ml-auto text-[13px] font-extrabold text-orange-500">
                          #{standing.rankPosition}
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      {categories.map((cat) => {
                        const catData = byCategory[cat];
                        return (
                          <div
                            key={cat}
                            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                {cat}
                              </p>
                              <div>
                                <span className="text-[22px] font-extrabold text-gray-900 tracking-tight">
                                  {catData.points}
                                </span>
                                <span className="text-[11px] text-gray-400 ml-1">
                                  pts
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              {catData.entries.map((entry, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between"
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
                                    <span className="text-[12px] text-gray-500 capitalize font-normal">
                                      {entry.placement.replace("_", " ")}
                                    </span>
                                  </div>
                                  <span className="text-[13px] font-bold text-gray-700">
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
      </main>

      {/* ── Bottom Nav — Mobile ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe z-50">
        <div className="flex">
          {[
            { to: "/athlete/dashboard", icon: "🏠", label: "Início" },
            { to: "/tournaments", icon: "🎾", label: "Torneios" },
            { to: "/athlete/profile", icon: "🏆", label: "Troféus" },
            { to: "/athlete/settings", icon: "👤", label: "Perfil" },
          ].map(({ to, icon, label }) => (
            <Link
              key={label}
              to={to}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
                pathname === to ? "text-[#00e87a]" : "text-[#6b7a99]"
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;
