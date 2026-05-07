import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AthleteData {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string;
  city?: string;
  state?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  birthDate?: string;
  bio?: string | null;
  gender?: string | null;
  createdAt: string;
  user?: { email: string };
  // Sprint 7 — perfil Strava
  nickname?: string | null;
  sports?: string[];
  rackets?: string[];
  instagramUrl?: string | null;
  twitterUrl?: string | null;
}

interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
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

interface PartnerStat {
  name: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}
interface CategoryStat {
  category: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

interface EnrichedPartner {
  athleteId: string | null;
  name: string;
  avatar: string | null;
  matchesTogether: number;
  winRate: number;
}

interface EnrichedOpponent {
  athleteId: string | null;
  name: string;
  avatar: string | null;
  headToHead: { wins: number; losses: number; totalMatches: number };
}

interface AthleteStats {
  trophies: AthleteTrophy[];
  achievements: {
    unlocked: Achievement[];
    inProgress: Achievement[];
    locked: Achievement[];
  };
  leagueStandings: LeagueStanding[];
  matchStats?: {
    wins: number;
    losses: number;
    totalMatches: number;
    winRate: number;
    topPartners: PartnerStat[];
    byCategory: CategoryStat[];
  };
  enrichedStats?: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number | null;
    setsWon: number;
    setsLost: number;
    bestPartners: EnrichedPartner[];
    frequentOpponents: EnrichedOpponent[];
    byCategory: Record<string, { matches: number; wins: number; winRate: number }>;
  };
  summary: {
    totalTrophies: number;
    totalTitles: number;
    totalAchievementsUnlocked: number;
    totalAchievementsAvailable: number;
    wins?: number;
    losses?: number;
    winRate?: number;
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

async function getSponsors(): Promise<Sponsor[]> {
  try {
    const res = await fetch(`${API_URL}/athlete/sponsors`, {
      headers: authHeaders(),
    });
    return (await res.json()).data ?? [];
  } catch {
    return [];
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
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tournaments" | "trophies" | "leagues"
  >("overview");
  const [achievementFilter, setAchievementFilter] = useState<
    "all" | "unlocked" | "inProgress"
  >("all");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [connections, setConnections] = useState<
    {
      friendshipId: string;
      athlete: {
        id: string;
        fullName: string;
        avatarUrl?: string | null;
        city?: string | null;
      };
    }[]
  >([]);
  const [showConnections, setShowConnections] = useState(false);

  const { pathname, state: navState } = useLocation();

  useEffect(() => {
    if ((navState as any)?.tab) {
      setActiveTab((navState as any).tab);
    }
  }, [navState]);

  useEffect(() => {
    Promise.all([getProfile(), getTournaments(), getStats(), getSponsors()])
      .then(([profile, tourns, athleteStats, athleteSponsors]) => {
        setAthlete(profile);
        setTournaments(tourns);
        setStats(athleteStats);
        setSponsors(athleteSponsors);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch connection count
    fetch(`${API_URL}/social/connections`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => {
        const data = Array.isArray(j.data) ? j.data : [];
        setConnections(data);
        setConnectionCount(data.length);
      })
      .catch(() => {});
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

  const handleShare = () => {
    const url = `${window.location.origin}/athletes/${athlete.id}`;
    const text = `🎾 ${athlete.fullName} no Bubble Padel — veja o perfil completo!`;
    if (navigator.share) {
      navigator.share({ title: athlete.fullName, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-12">
        {/* ── Hero Card ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-5">
          {/* Banner */}
          <div className="h-28 md:h-32 relative overflow-hidden">
            {athlete.bannerUrl ? (
              <img
                src={athlete.bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#00e87a]/10 via-[#00c8ff]/5 to-[#00e87a]/10" />
            )}
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4 relative z-10">
              <button
                onClick={() =>
                  athlete.avatarUrl && setLightboxUrl(athlete.avatarUrl)
                }
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-[3px] border-white bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(0,232,122,0.3)] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
              >
                {athlete.avatarUrl ? (
                  <img
                    src={athlete.avatarUrl}
                    alt={athlete.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl md:text-2xl font-extrabold text-[#0a0e1a]">
                    {getInitials(athlete.fullName)}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  title="Compartilhar perfil"
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {copied ? (
                    <svg
                      className="w-4 h-4 text-[#00e87a] flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  )}
                  <span className="hidden sm:inline">
                    {copied ? "Copiado!" : "Compartilhar"}
                  </span>
                </button>
                <Link
                  to="/athlete/profile/edit"
                  title="Editar Perfil"
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Editar Perfil</span>
                </Link>
              </div>
            </div>

            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-0.5">
              {athlete.fullName}
            </h1>
            {athlete.nickname && (
              <p className="text-[14px] font-semibold text-[#00e87a] mb-1.5">
                {athlete.nickname}
              </p>
            )}
            {athlete.bio && (
              <p className="text-[13px] text-gray-600 font-normal mb-2 leading-relaxed">
                {athlete.bio}
              </p>
            )}
            {location !== "—" && (
              <p className="text-[12px] text-gray-500 mb-3 font-normal">
                📍 {location}
              </p>
            )}

            {/* Esportes / Raquete / Redes sociais */}
            {((athlete.sports && athlete.sports.length > 0) ||
              (athlete.rackets && athlete.rackets.length > 0) ||
              athlete.instagramUrl ||
              athlete.twitterUrl) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {athlete.sports?.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#00e87a]/10 text-green-700 border border-[#00e87a]/20"
                  >
                    {s === "BEACH_TENNIS"
                      ? "🏖️ Beach Tennis"
                      : s === "PADEL"
                        ? "🎾 Padel"
                        : s === "TENIS"
                          ? "🎾 Tênis"
                          : "🏓 Pickleball"}
                  </span>
                ))}
                {athlete.rackets?.map(
                  (r) =>
                    r && (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        🏸 {r}
                      </span>
                    ),
                )}
                {athlete.instagramUrl && (
                  <a
                    href={`https://instagram.com/${athlete.instagramUrl!.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Instagram: @${athlete.instagramUrl!.replace("@", "")}`}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {athlete.twitterUrl && (
                  <a
                    href={`https://twitter.com/${athlete.twitterUrl!.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Twitter: @${athlete.twitterUrl!.replace("@", "")}`}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Conexões */}
            <div className="pt-3 pb-3 border-t border-gray-100">
              <button
                onClick={() => setShowConnections(true)}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium hover:text-gray-600 transition-colors"
              >
                <span className="flex -space-x-1">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="w-5 h-5 rounded-full bg-gray-200 border border-white inline-block"
                    />
                  ))}
                </span>
                <span className="text-gray-500 font-semibold">
                  {connectionCount}
                </span>
                <span className="text-gray-400">
                  {connectionCount === 1 ? "conexão" : "conexões"}
                </span>
                <svg
                  className="w-3 h-3 ml-0.5 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
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
                  value:
                    stats?.matchStats?.winRate != null
                      ? `${stats.matchStats.winRate}%`
                      : "—",
                  label: "% Aproveit.",
                  color: "text-blue-600",
                  title:
                    stats?.matchStats?.winRate == null
                      ? "Disponível após partidas"
                      : undefined,
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
            {/* Card Sobre — só aparece se bio preenchida */}
            {athlete.bio && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                <h2 className="text-[14px] font-extrabold text-gray-900 mb-2 tracking-tight">
                  Sobre
                </h2>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {athlete.bio}
                </p>
              </div>
            )}

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

            {/* Estatísticas Detalhadas — Sprint 7.S1 */}
            <div className="bg-gradient-to-br from-[#0a0e1a] to-[#141824] border border-white/[0.08] rounded-2xl p-5 space-y-5">
              <h2 className="text-[14px] font-extrabold text-[#f0f4ff] tracking-tight">
                Estatísticas Detalhadas
              </h2>

              {/* Win/Loss counters */}
              {stats?.matchStats ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Vitórias",
                        value: stats.matchStats.wins,
                        color: "text-[#00e87a]",
                      },
                      {
                        label: "Derrotas",
                        value: stats.matchStats.losses,
                        color: "text-red-400",
                      },
                      {
                        label: "Win Rate",
                        value: `${stats.matchStats.winRate}%`,
                        color:
                          stats.matchStats.winRate >= 50
                            ? "text-[#00e87a]"
                            : "text-amber-400",
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="bg-white/[0.05] border border-white/[0.06] rounded-xl p-3 text-center"
                      >
                        <p
                          className={`text-[22px] font-black leading-none mb-1 ${color}`}
                        >
                          {value}
                        </p>
                        <p className="text-[10px] font-bold text-[#6b7a99] uppercase tracking-wide">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Win rate bar */}
                  {stats.matchStats.totalMatches > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#6b7a99] mb-1.5">
                        <span>
                          {stats.matchStats.wins}V / {stats.matchStats.losses}D
                        </span>
                        <span>{stats.matchStats.totalMatches} partidas</span>
                      </div>
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00e87a] rounded-full transition-all"
                          style={{ width: `${stats.matchStats.winRate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Sets (enrichedStats) */}
                  {stats.enrichedStats && (stats.enrichedStats.setsWon > 0 || stats.enrichedStats.setsLost > 0) && (
                    <div className="flex items-center justify-between text-[12px] pt-1 border-t border-white/[0.06]">
                      <span className="text-[#6b7a99] font-semibold">Sets</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#00e87a] font-bold">{stats.enrichedStats.setsWon}W</span>
                        <span className="text-[#6b7a99]">/</span>
                        <span className="text-red-400 font-bold">{stats.enrichedStats.setsLost}L</span>
                      </div>
                    </div>
                  )}

                  {/* Por categoria */}
                  {stats.matchStats.byCategory.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-[#6b7a99] uppercase tracking-widest mb-2">
                        Por Categoria
                      </p>
                      <div className="space-y-2">
                        {stats.matchStats.byCategory.map((cat) => (
                          <div
                            key={cat.category}
                            className="flex items-center justify-between text-[12px]"
                          >
                            <span className="text-[#9ba5be] font-medium truncate max-w-[120px]">
                              {cat.category}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-[#00e87a] font-bold">
                                {cat.wins}V
                              </span>
                              <span className="text-red-400 font-bold">
                                {cat.losses}D
                              </span>
                              <span
                                className={`font-extrabold text-[11px] ${cat.winRate >= 50 ? "text-[#00e87a]" : "text-amber-400"}`}
                              >
                                {cat.winRate}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {["Vitórias", "Derrotas", "% Aproveit."].map((label) => (
                    <div
                      key={label}
                      className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center animate-pulse"
                    >
                      <div className="h-5 bg-white/[0.06] rounded-md mb-2" />
                      <p className="text-[10px] font-semibold text-[#6b7a99] uppercase tracking-wide">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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

            {/* Parceiros */}
            {(stats?.matchStats?.topPartners ?? []).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    🤝 Parceiros
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {stats!.matchStats!.topPartners.map((p, i) => (
                    <div key={p.name} className="px-5 py-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-[#00e87a]/10 border border-[#00e87a]/20 flex items-center justify-center text-[13px] font-extrabold text-[#00e87a] flex-shrink-0">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-normal">
                            {p.total} jogo{p.total !== 1 ? "s" : ""} · {p.wins}V{" "}
                            {p.losses}D
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {i === 0 && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                              #1
                            </span>
                          )}
                          <span
                            className={`text-[14px] font-extrabold ${p.winRate >= 50 ? "text-[#00e87a]" : "text-amber-500"}`}
                          >
                            {p.winRate}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${p.winRate >= 50 ? "bg-[#00e87a]" : "bg-amber-400"}`}
                          style={{ width: `${p.winRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adversários Frequentes */}
            {(stats?.enrichedStats?.frequentOpponents ?? []).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    ⚔️ Adversários Frequentes
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {stats!.enrichedStats!.frequentOpponents.map((opp) => {
                    const { wins, losses, totalMatches } = opp.headToHead;
                    const wr = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
                    return (
                      <div key={opp.name} className="px-5 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-[13px] font-extrabold text-red-400 flex-shrink-0">
                          {opp.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">{opp.name}</p>
                          <p className="text-[11px] text-gray-400 font-normal">
                            {totalMatches} jogo{totalMatches !== 1 ? "s" : ""} · {wins}V {losses}D
                          </p>
                        </div>
                        <span className={`text-[14px] font-extrabold flex-shrink-0 ${wr >= 50 ? "text-[#00e87a]" : "text-amber-500"}`}>
                          {wr}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sponsors.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    🏅 Patrocinadores
                  </h2>
                </div>
                <div className="p-5 flex flex-wrap gap-3">
                  {sponsors.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl"
                    >
                      {sp.logoUrl ? (
                        <img
                          src={sp.logoUrl}
                          alt={sp.name}
                          className="w-7 h-7 rounded-lg object-contain bg-white border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-sm flex-shrink-0">
                          🏅
                        </div>
                      )}
                      {sp.websiteUrl ? (
                        <a
                          href={sp.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-bold text-blue-600 hover:underline"
                        >
                          {sp.name}
                        </a>
                      ) : (
                        <span className="text-[13px] font-bold text-gray-800">
                          {sp.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {/* Membro desde — sempre o último item */}
            <div className="text-center py-6">
              <p className="text-[12px] text-gray-400 font-normal">
                📅 Membro desde {memberSince}
              </p>
            </div>
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
          <Link
            to="/athlete/dashboard"
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathname === "/athlete/dashboard" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
          >
            <span className="text-xl leading-none">🏠</span>Início
          </Link>
          <Link
            to="/athlete/feed"
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathname === "/athlete/feed" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
          >
            <span className="text-xl leading-none">📰</span>Feed
          </Link>
          <Link
            to="/tournaments"
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathname === "/tournaments" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
          >
            <span className="text-xl leading-none">🎾</span>Torneios
          </Link>
          <Link
            to="/athlete/profile"
            state={{ tab: "trophies" }}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99] transition-colors"
          >
            <span className="text-xl leading-none">🏆</span>Troféus
          </Link>
          <Link
            to="/athlete/profile"
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathname === "/athlete/profile" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
          >
            <span className="text-xl leading-none">👤</span>Perfil
          </Link>
        </div>
      </div>

      {/* ── Modal Conexões ────────────────────────────────────────────────── */}
      {showConnections && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConnections(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-[16px] font-extrabold text-gray-900">
                Conexões ({connectionCount})
              </h2>
              <button
                onClick={() => setShowConnections(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] divide-y divide-gray-100">
              {connections.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Nenhuma conexão ainda.
                </div>
              ) : (
                connections.map((c) => (
                  <Link
                    key={c.friendshipId}
                    to={`/athlete/${c.athlete.id}`}
                    onClick={() => setShowConnections(false)}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center text-[#0a0e1a] text-xs font-extrabold overflow-hidden flex-shrink-0">
                      {c.athlete.avatarUrl ? (
                        <img
                          src={c.athlete.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        c.athlete.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">
                        {c.athlete.fullName}
                      </p>
                      {c.athlete.city && (
                        <p className="text-[11px] text-gray-400">
                          {c.athlete.city}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Foto de perfil"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-xl leading-none"
            onClick={() => setLightboxUrl(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
export default AthleteProfile;
