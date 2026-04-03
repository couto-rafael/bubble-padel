import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface LeaguePublic {
  id: string;
  name: string;
  description: string;
  sport: string | null;
  status: string;
  createdByClub: { id: string; name: string; city: string; state: string };
  pointsChampion: number;
  pointsRunnerUp: number;
  pointsSemi: number;
  pointsQuarter: number;
  pointsGroup: number;
  pointsRound16: number | null;
  pointsRound32: number | null;
  tournaments: Array<{
    id: string;
    tournamentId: string;
    tournament: {
      id: string;
      name: string;
      sport: string;
      status: string;
      startDate: string;
      endDate: string;
      categories: string[];
      club: { name: string; city: string };
    };
  }>;
  ranking: {
    categories: Record<string, RankingEntry[]>;
    availableCategories: string[];
  };
}

interface RankingEntry {
  position: number;
  athleteId: string;
  fullName: string;
  city: string | null;
  points: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

async function getLeague(id: string): Promise<LeaguePublic> {
  const res = await fetch(`${API_URL}/public/leagues/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Liga não encontrada");
  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeSport(s: string | null) {
  switch (s?.toUpperCase()) {
    case "PADEL":
      return "Padel";
    case "BEACH_TENNIS":
      return "Beach Tennis";
    case "TENIS":
      return "Tênis";
    case "PICKLEBALL":
      return "Pickleball";
    default:
      return s ?? "Todos os esportes";
  }
}

function normalizeTournamentStatus(s: string) {
  switch (s?.toUpperCase()) {
    case "COMPLETED":
      return { label: "Finalizado", cls: "bg-purple-100 text-purple-700" };
    case "ONGOING":
      return { label: "Em Andamento", cls: "bg-blue-100 text-blue-700" };
    case "OPEN":
      return {
        label: "Inscrições Abertas",
        cls: "bg-emerald-100 text-emerald-700",
      };
    case "CLOSED":
      return { label: "Encerrado", cls: "bg-red-100 text-red-700" };
    default:
      return { label: "Em Breve", cls: "bg-gray-100 text-gray-600" };
  }
}

function formatDate(d: string) {
  return new Date(d.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?"
  );
}

function handleShare(league: LeaguePublic) {
  const url = window.location.href;
  const text = `🏆 ${league.name} — Veja o ranking completo no Bubble Padel!`;
  if (navigator.share) {
    navigator.share({ title: league.name, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => alert("Link copiado!"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const LeagueProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [league, setLeague] = useState<LeaguePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "ranking" | "tournaments" | "points"
  >("ranking");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    if (!id) return;
    getLeague(id)
      .then((data) => {
        setLeague(data);
        if (data.ranking.availableCategories.length > 0) {
          setSelectedCategory(data.ranking.availableCategories[0]);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !league) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center text-center px-4">
        <div>
          <span className="text-5xl block mb-4">🏆</span>
          <h1 className="text-2xl font-bold text-white mb-2">
            Liga não encontrada
          </h1>
          <p className="text-gray-400 mb-6">
            O link pode estar incorreto ou a liga foi removida.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-[#00ff88] text-[#0a0e27] rounded-lg font-bold hover:bg-[#00dd77] transition-colors"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "ranking" as const,
      label: `Ranking ${league.ranking.availableCategories.length > 0 ? `(${league.ranking.availableCategories.length} categorias)` : ""}`,
    },
    {
      id: "tournaments" as const,
      label: `Torneios (${league.tournaments.length})`,
    },
    { id: "points" as const, label: "Pontuação" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#0a0e27]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold">Bubble</span>
          </Link>
          <button
            onClick={() => handleShare(league)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg
              className="w-4 h-4"
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
            Compartilhar
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-16 max-w-4xl mx-auto px-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-xl flex items-center justify-center text-[#0a0e27] text-2xl flex-shrink-0">
                🏆
              </div>
              <div>
                <h1 className="text-2xl font-black text-white mb-1">
                  {league.name}
                </h1>
                {league.description && (
                  <p className="text-gray-400 text-sm mb-2">
                    {league.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                  {league.sport && (
                    <span className="px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] rounded-full text-xs font-semibold border border-[#00ff88]/20">
                      {normalizeSport(league.sport)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                      />
                    </svg>
                    {league.createdByClub.name}
                    {league.createdByClub.city &&
                      ` · ${league.createdByClub.city}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats rápidas */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-white">
                  {league.tournaments.length}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Torneios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-[#00ff88]">
                  {league.ranking.availableCategories.length}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Categorias</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#00ff88] text-[#0a0e27]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Ranking */}
        {activeTab === "ranking" && (
          <div className="space-y-4">
            {league.ranking.availableCategories.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center text-gray-400">
                <span className="text-4xl block mb-3">📊</span>
                <p className="font-medium text-gray-300">
                  Ranking ainda não disponível
                </p>
                <p className="text-sm mt-1">
                  O ranking aparece após o primeiro torneio ser concluído.
                </p>
              </div>
            ) : (
              <>
                {/* Seletor de categoria */}
                <div className="flex gap-2 flex-wrap">
                  {league.ranking.availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedCategory === cat
                          ? "bg-[#00ff88] text-[#0a0e27]"
                          : "bg-white/5 border border-white/10 text-gray-400 hover:border-[#00ff88]/30 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Tabela da categoria selecionada */}
                {selectedCategory &&
                  league.ranking.categories[selectedCategory] && (
                    <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          {selectedCategory}
                        </p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5 text-left">
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-12">
                              #
                            </th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                              Atleta
                            </th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                              Pontos
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {league.ranking.categories[selectedCategory].map(
                            (r) => (
                              <tr
                                key={r.athleteId}
                                className={
                                  r.position <= 3
                                    ? "bg-[#00ff88]/5"
                                    : "hover:bg-white/5"
                                }
                              >
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`text-sm font-bold ${
                                      r.position === 1
                                        ? "text-amber-400"
                                        : r.position === 2
                                          ? "text-gray-400"
                                          : r.position === 3
                                            ? "text-amber-600"
                                            : "text-gray-600"
                                    }`}
                                  >
                                    {r.position === 1
                                      ? "🥇"
                                      : r.position === 2
                                        ? "🥈"
                                        : r.position === 3
                                          ? "🥉"
                                          : r.position}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                      {getInitials(r.fullName)}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-white">
                                        {r.fullName}
                                      </p>
                                      {r.city && (
                                        <p className="text-xs text-gray-500">
                                          {r.city}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <span className="font-bold text-[#00ff88]">
                                    {r.points}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    pts
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        {/* Tab: Torneios */}
        {activeTab === "tournaments" && (
          <div className="space-y-3">
            {league.tournaments.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center text-gray-400">
                <span className="text-4xl block mb-3">🎾</span>
                <p className="font-medium text-gray-300">
                  Nenhum torneio vinculado ainda
                </p>
              </div>
            ) : (
              league.tournaments.map((lt) => {
                const status = normalizeTournamentStatus(lt.tournament.status);
                return (
                  <Link
                    key={lt.id}
                    to={`/tournaments/${lt.tournament.id}`}
                    className="block bg-gradient-to-br from-[#1a1f4a]/60 to-[#0f1540]/60 border border-white/10 hover:border-[#00ff88]/30 rounded-xl p-5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-white/10 text-gray-300 rounded-full">
                            {normalizeSport(lt.tournament.sport)}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="font-bold text-white mb-1">
                          {lt.tournament.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {lt.tournament.club.name} · {lt.tournament.club.city}
                        </p>
                        {lt.tournament.categories.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {lt.tournament.categories.join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {formatDate(lt.tournament.startDate)}
                        </p>
                        <svg
                          className="w-4 h-4 text-gray-600 ml-auto mt-2"
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
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Pontuação */}
        {activeTab === "points" && (
          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-4">
              Tabela de Pontos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "🥇 Campeão", value: league.pointsChampion },
                { label: "🥈 Vice-campeão", value: league.pointsRunnerUp },
                { label: "🥉 Semifinal", value: league.pointsSemi },
                { label: "Quartas de Final", value: league.pointsQuarter },
                { label: "Fase de Grupos", value: league.pointsGroup },
                ...(league.pointsRound16 != null
                  ? [{ label: "Oitavas de Final", value: league.pointsRound16 }]
                  : []),
                ...(league.pointsRound32 != null
                  ? [{ label: "16avos de Final", value: league.pointsRound32 }]
                  : []),
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                >
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-2xl font-black text-[#00ff88]">{value}</p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LeagueProfile;
