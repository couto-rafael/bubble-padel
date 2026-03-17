import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "./AthleteHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── API ──────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const token = () => localStorage.getItem("auth_token") ?? "";

async function getProfile(): Promise<AthleteData> {
  const res = await fetch(`${API_URL}/athlete/profile`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const json = await res.json();
  return json.data;
}

async function getTournaments(): Promise<TournamentEntry[]> {
  const res = await fetch(`${API_URL}/athlete/tournaments`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const json = await res.json();
  return json.data ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const date = new Date(d);
  return date.toLocaleDateString("pt-BR");
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

// Generate heatmap for last 84 days based on tournament dates
function generateHeatmap(entries: TournamentEntry[]) {
  const today = new Date();
  const data = [];
  const activeDates = new Set(
    entries.map((e) => new Date(e.tournament.startDate).toDateString()),
  );

  for (let i = 83; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const active = activeDates.has(date.toDateString());
    data.push({
      date,
      intensity: active ? Math.floor(Math.random() * 3) + 2 : 0,
    });
  }
  return data;
}

const INTENSITY_COLORS = [
  "bg-gray-100",
  "bg-green-200",
  "bg-green-400",
  "bg-green-500",
  "bg-green-600",
];

// ─── Component ────────────────────────────────────────────────────────────────

const AthleteProfile: React.FC = () => {
  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [tournaments, setTournaments] = useState<TournamentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tournaments" | "trophies"
  >("overview");

  useEffect(() => {
    Promise.all([getProfile(), getTournaments()])
      .then(([profile, tourns]) => {
        setAthlete(profile);
        setTournaments(tourns);
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
  const completedTournaments = tournaments.filter(
    (t) => t.tournament.status === "COMPLETED",
  ).length;
  const location =
    [athlete.city, athlete.state].filter(Boolean).join(", ") || "—";
  const memberSince = new Date(athlete.createdAt).getFullYear();

  // Badges baseadas na actividade real
  const badges = [
    ...(totalTournaments >= 1
      ? [
          {
            icon: "🎾",
            name: "Primeiro Torneio",
            desc: "Inscreveu-se no primeiro torneio",
          },
        ]
      : []),
    ...(totalTournaments >= 5
      ? [{ icon: "🏅", name: "Competidor", desc: "5 torneios inscritos" }]
      : []),
    ...(totalTournaments >= 10
      ? [{ icon: "🏆", name: "Veterano", desc: "10 torneios inscritos" }]
      : []),
    ...(completedTournaments >= 1
      ? [{ icon: "✅", name: "Finalizador", desc: "Completou um torneio" }]
      : []),
    ...(memberSince <= new Date().getFullYear()
      ? [
          {
            icon: "⭐",
            name: `Membro ${memberSince}`,
            desc: "Membro desde o início",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AthleteHeader />

      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Hero Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
            {/* Banner */}
            <div className="h-24 bg-gradient-to-r from-[#1a1f4a] to-[#0f1540]" />

            <div className="px-6 pb-6">
              {/* Avatar + Name row */}
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
              <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100">
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
                  <div className="text-2xl font-black text-purple-600">
                    {completedTournaments}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900">
                    {badges.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Badges</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6">
            {(
              [
                { id: "overview", label: "Visão Geral" },
                { id: "tournaments", label: "Torneios" },
                { id: "trophies", label: "Troféus & Badges" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1a1f4a] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
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

              {/* Recent tournaments */}
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

              {/* Badges preview */}
              {badges.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-4">
                    Badges Conquistadas
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {badges.map((badge, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <span className="text-xl">{badge.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {badge.name}
                          </p>
                          <p className="text-xs text-gray-400">{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Tournaments */}
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

          {/* Tab: Trophies */}
          {activeTab === "trophies" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-gray-900 mb-6">
                  Sala de Troféus
                </h2>
                {completedTournaments === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <span className="text-5xl block mb-3">🏆</span>
                    <p className="text-sm font-medium text-gray-600">
                      Ainda sem troféus
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Complete torneios para ganhar troféus
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {tournaments
                      .filter((t) => t.tournament.status === "COMPLETED")
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="text-center p-4 bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-xl"
                        >
                          <span className="text-4xl block mb-2">🏆</span>
                          <p className="text-sm font-bold text-gray-800">
                            {entry.tournament.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {entry.category}
                          </p>
                          <p className="text-xs text-gray-400">
                            {entry.tournament.club.name}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Badges ({badges.length})
                </h2>
                {badges.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">
                      Inscreva-se em torneios para ganhar badges.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {badges.map((badge, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <span className="text-3xl">{badge.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {badge.name}
                          </p>
                          <p className="text-xs text-gray-400">{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                    {/* Locked badges */}
                    {totalTournaments < 5 && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 opacity-50">
                        <span className="text-3xl grayscale">🏅</span>
                        <div>
                          <p className="font-semibold text-gray-400">
                            Competidor
                          </p>
                          <p className="text-xs text-gray-400">
                            {5 - totalTournaments} torneios para desbloquear
                          </p>
                        </div>
                      </div>
                    )}
                    {totalTournaments < 10 && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 opacity-50">
                        <span className="text-3xl grayscale">🏆</span>
                        <div>
                          <p className="font-semibold text-gray-400">
                            Veterano
                          </p>
                          <p className="text-xs text-gray-400">
                            {10 - totalTournaments} torneios para desbloquear
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AthleteProfile;
