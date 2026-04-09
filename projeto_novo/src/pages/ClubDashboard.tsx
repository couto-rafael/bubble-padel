import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import { useTournaments } from "../hooks";
import OnboardingChecklist from "../components/OnboardingChecklist";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (preservados 100%)
// ─────────────────────────────────────────────────────────────────────────────

function mapStatus(
  status: string,
):
  | "Rascunho"
  | "Publicado"
  | "Aberto"
  | "Em Andamento"
  | "Finalizado"
  | "Encerrado" {
  switch (status) {
    case "published":
      return "Publicado";
    case "open":
      return "Aberto";
    case "closed":
      return "Encerrado";
    case "ongoing":
      return "Em Andamento";
    case "completed":
      return "Finalizado";
    default:
      return "Rascunho";
  }
}

function parseLocalDate(d: string): Date {
  return new Date(d.slice(0, 10) + "T12:00:00");
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "—";
  const fmt = (d: string) =>
    parseLocalDate(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  if (!endDate || startDate === endDate) return fmt(startDate);
  const s = parseLocalDate(startDate);
  const e = parseLocalDate(endDate);
  const sameMonth =
    s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    const month = s.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
    return `${s.getDate()}–${e.getDate()} ${month}`;
  }
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG — DS v2
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> =
  {
    Rascunho: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-400",
    },
    Publicado: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    Aberto: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    Encerrado: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
    "Em Andamento": {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    Finalizado: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
    },
  };

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const ClubDashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("Todos");
  const { tournaments, loading } = useTournaments();

  // ── Derivações (lógica preservada) ────────────────────────────────────────

  const mapped = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    date: formatDateRange(t.startDate, t.endDate),
    status: mapStatus(t.status),
    teams: t.totalTeams ?? 0,
    maxTeams: t.maxTeams ?? 0,
    category: (t.categories ?? []).join(", ") || "—",
    sport: t.sport ?? "",
  }));

  const totalTournaments = mapped.length;
  const activeTournaments = mapped.filter(
    (t) => t.status === "Aberto" || t.status === "Em Andamento",
  ).length;
  const totalTeams = mapped.reduce((sum, t) => sum + t.teams, 0);
  const totalParticipants = totalTeams * 2;

  const filterMap: Record<string, string> = {
    Abertos: "Aberto",
    "Em Andamento": "Em Andamento",
    Finalizados: "Finalizado",
  };
  const filteredTournaments =
    selectedFilter === "Todos"
      ? mapped
      : mapped.filter((t) => t.status === filterMap[selectedFilter]);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <DashboardHeader activePage="dashboard" />

      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-0.5">
                Bem-vindo de volta! 👋
              </h1>
              <p className="text-sm text-gray-500 font-normal capitalize">
                {today}
              </p>
            </div>
            <Link
              to="/dashboard/tournaments/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Novo Torneio
            </Link>
          </div>

          {/* ── Onboarding ────────────────────────────────────────────────── */}
          <OnboardingChecklist tournaments={tournaments} />

          {/* ── Stat Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total de Torneios",
                value: loading ? "—" : totalTournaments,
                sub: `${totalTournaments} criados`,
                color: "text-blue-600",
                bg: "bg-blue-50",
                icon: "🏆",
              },
              {
                label: "Ativos",
                value: loading ? "—" : activeTournaments,
                sub: activeTournaments === 1 ? "em andamento" : "em andamento",
                color: "text-green-600",
                bg: "bg-green-50",
                icon: "⚡",
              },
              {
                label: "Duplas Inscritas",
                value: loading ? "—" : totalTeams,
                sub: "em todos os torneios",
                color: "text-purple-600",
                bg: "bg-purple-50",
                icon: "🎾",
              },
              {
                label: "Participantes",
                value: loading ? "—" : totalParticipants,
                sub: "total de atletas",
                color: "text-amber-600",
                bg: "bg-amber-50",
                icon: "👥",
              },
            ].map(({ label, value, sub, color, bg, icon }) => (
              <div
                key={label}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center text-lg mb-3`}
                >
                  {icon}
                </div>
                <p
                  className={`text-[30px] font-extrabold tracking-tight leading-none mb-1 ${color}`}
                >
                  {value}
                </p>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-[12px] text-gray-400 font-normal mt-0.5">
                  {sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── Ações Rápidas ─────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Ações Rápidas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Novo Torneio",
                  icon: "➕",
                  to: "/dashboard/tournaments/create",
                  primary: true,
                },
                {
                  label: "Gerenciar Torneios",
                  icon: "📋",
                  to: "/dashboard/tournaments",
                  primary: false,
                },
                {
                  label: "Ligas",
                  icon: "🏅",
                  to: "/dashboard/leagues",
                  primary: false,
                },
                {
                  label: "Configurações",
                  icon: "⚙️",
                  to: "/dashboard/settings",
                  primary: false,
                },
              ].map(({ label, icon, to, primary }) => (
                <Link
                  key={label}
                  to={to}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                    primary
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Lista de Torneios ──────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight">
                  Torneios
                </h2>
                <Link
                  to="/dashboard/tournaments"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver todos →
                </Link>
              </div>

              {/* Filtros — LineTabs style */}
              <div className="flex gap-1">
                {["Todos", "Abertos", "Em Andamento", "Finalizados"].map(
                  (filter) => {
                    const count =
                      filter === "Todos"
                        ? mapped.length
                        : filter === "Abertos"
                          ? mapped.filter((t) => t.status === "Aberto").length
                          : filter === "Em Andamento"
                            ? mapped.filter((t) => t.status === "Em Andamento")
                                .length
                            : mapped.filter((t) => t.status === "Finalizado")
                                .length;
                    return (
                      <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                          selectedFilter === filter
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {filter}
                        {count > 0 && (
                          <span
                            className={`ml-1.5 text-[10px] font-bold ${selectedFilter === filter ? "opacity-70" : "opacity-50"}`}
                          >
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              /* Skeleton */
              <div className="divide-y divide-gray-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded-lg w-48 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded-lg w-32 animate-pulse" />
                    </div>
                    <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredTournaments.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center text-center px-6 py-12">
                <span className="text-4xl mb-3 opacity-40">🎾</span>
                <p className="text-[14px] font-extrabold text-gray-700 mb-1">
                  {selectedFilter === "Todos"
                    ? "Nenhum torneio ainda"
                    : `Nenhum torneio ${selectedFilter.toLowerCase()}`}
                </p>
                <p className="text-[12px] text-gray-400 font-normal mb-4">
                  {selectedFilter === "Todos"
                    ? "Crie seu primeiro torneio para começar"
                    : "Ajuste o filtro para ver outros torneios"}
                </p>
                {selectedFilter === "Todos" && (
                  <Link
                    to="/dashboard/tournaments/create"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Criar torneio
                  </Link>
                )}
              </div>
            ) : (
              /* Tournament list */
              <div className="divide-y divide-gray-50">
                {filteredTournaments.map((tournament) => {
                  const config =
                    STATUS_CONFIG[tournament.status] ??
                    STATUS_CONFIG["Rascunho"];
                  const progress = tournament.maxTeams
                    ? (tournament.teams / tournament.maxTeams) * 100
                    : 0;
                  const sportIcon =
                    tournament.sport?.toUpperCase() === "BEACH_TENNIS"
                      ? "🏖️"
                      : "🎾";
                  return (
                    <Link
                      key={tournament.id}
                      to={`/dashboard/tournaments/${tournament.id}/edit`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Ícone de esporte */}
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                        {sportIcon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold text-gray-900 text-[14px] truncate group-hover:text-blue-600 transition-colors">
                            {tournament.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-gray-500 font-normal flex-wrap">
                          <span>📅 {tournament.date}</span>
                          <span>· {tournament.category}</span>
                        </div>

                        {/* Progress bar de inscrições */}
                        {tournament.maxTeams > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress >= 90
                                    ? "bg-red-500"
                                    : progress >= 60
                                      ? "bg-amber-500"
                                      : "bg-blue-500"
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                              {tournament.teams}/{tournament.maxTeams} duplas
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${config.bg} ${config.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`}
                        />
                        {tournament.status}
                      </span>

                      {/* Arrow */}
                      <svg
                        className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors"
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
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClubDashboard;
