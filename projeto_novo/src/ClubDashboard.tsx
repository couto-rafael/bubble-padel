import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import { useTournaments } from "./hooks";
import OnboardingChecklist from "./OnboardingChecklist";

// ─── Helpers ───────────────────────────────────────────────

// Converte status do backend (lowercase) para label PT-BR
function mapStatus(
  status: string,
): "Rascunho" | "Aberto" | "Em Andamento" | "Finalizado" {
  switch (status) {
    case "published":
      return "Aberto";
    case "ongoing":
      return "Em Andamento";
    case "completed":
      return "Finalizado";
    default:
      return "Rascunho";
  }
}

// Formata datas do torneio: "12–14 Mar 2026" ou "12 Mar 2026"
// Converte string de data para Date sem bug de fuso horário (UTC-3 Brasil)
// "2026-03-23" → new Date("2026-03-23") = 22 mar em UTC-3 ← BUG
// "2026-03-23" → new Date("2026-03-23T12:00:00") = 23 mar em qualquer fuso ← CORRETO
function parseLocalDate(d: string): Date {
  return new Date(d.slice(0, 10) + "T12:00:00");
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "—";
  const fmt = (d: string) => {
    const date = parseLocalDate(d);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
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

// ─── Style Configurations ──────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> =
  {
    Rascunho: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
    Aberto: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    "Em Andamento": {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    Finalizado: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-400",
    },
  };

// ─── Sub-components ────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  trend = "neutral",
}: StatCardProps) => {
  const trendColors = {
    up: "text-emerald-600",
    down: "text-gray-500",
    neutral: "text-gray-500",
  };
  const trendIcons = {
    up: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    down: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    neutral: "M5 12h14",
  };
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} p-3 rounded-lg`}>{icon}</div>
        {trend !== "neutral" && (
          <svg
            className={`w-5 h-5 ${trendColors[trend]}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={trendIcons[trend]}
            />
          </svg>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className={`text-sm font-medium ${trendColors[trend]}`}>{subtitle}</p>
    </div>
  );
};

interface QuickActionProps {
  label: string;
  icon: string;
  to: string;
  variant: "primary" | "secondary" | "outline";
}

const QuickAction = ({ label, icon, to, variant }: QuickActionProps) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow",
    secondary:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow",
    outline:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400",
  };
  return (
    <Link
      to={to}
      className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg font-semibold text-sm transition-all ${variants[variant]}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {label}
    </Link>
  );
};

// ─── Main Component ────────────────────────────────────────

const ClubDashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("Todos");
  const { tournaments, loading } = useTournaments();

  // Mapeia torneios do backend para o formato de exibição
  const mapped = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    date: formatDateRange(t.startDate, t.endDate),
    status: mapStatus(t.status),
    teams: t.totalTeams ?? 0,
    maxTeams: t.maxTeams ?? 0,
    category: (t.categories ?? []).join(", ") || "—",
  }));

  // Stats reais
  const totalTournaments = mapped.length;
  const activeTournaments = mapped.filter(
    (t) => t.status === "Aberto" || t.status === "Em Andamento",
  ).length;
  const totalParticipants = mapped.reduce((sum, t) => sum + t.teams * 2, 0);

  // Filtro
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader activePage="dashboard" />

      <main className="pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Bem-vindo de volta! 👋
                </h1>
                <p className="text-gray-600">
                  Aqui está um resumo das suas atividades
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {today}
                </p>
              </div>
            </div>
          </div>

          {/* Onboarding Checklist — task 2.1 (some após 3 torneios) */}
          <OnboardingChecklist tournaments={tournaments} />

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickAction
                  label="Novo Torneio"
                  icon="M12 4v16m8-8H4"
                  to="/dashboard/tournaments/create"
                  variant="primary"
                />
                <QuickAction
                  label="Gerenciar Torneios"
                  icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  to="/dashboard/tournaments"
                  variant="secondary"
                />
                <QuickAction
                  label="Relatórios"
                  icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  to="/dashboard/reports"
                  variant="outline"
                />
                <QuickAction
                  label="Configurações"
                  icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  to="/dashboard/profile"
                  variant="outline"
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total de Torneios"
              value={loading ? "—" : totalTournaments}
              subtitle={
                totalTournaments === 1
                  ? "1 torneio criado"
                  : `${totalTournaments} torneios criados`
              }
              trend="neutral"
              icon={
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              }
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Torneios Ativos"
              value={loading ? "—" : activeTournaments}
              subtitle={
                activeTournaments === 1
                  ? "1 em andamento"
                  : `${activeTournaments} em andamento`
              }
              icon={
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
              iconBg="bg-emerald-50"
            />
            <StatCard
              title="Participantes"
              value={loading ? "—" : totalParticipants}
              subtitle="total de atletas inscritos"
              icon={
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              iconBg="bg-purple-50"
            />
            <StatCard
              title="Duplas Inscritas"
              value={
                loading ? "—" : mapped.reduce((sum, t) => sum + t.teams, 0)
              }
              subtitle="em todos os torneios"
              icon={
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              iconBg="bg-amber-50"
            />
          </div>

          {/* Tournaments List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h2 className="text-base font-bold text-gray-900">
                    Torneios
                  </h2>
                </div>
                <Link
                  to="/dashboard/tournaments"
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver todos
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["Todos", "Abertos", "Em Andamento", "Finalizados"].map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedFilter === filter
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {filter}
                    </button>
                  ),
                )}
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500 text-sm">
                Carregando torneios...
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500 text-sm">
                Nenhum torneio encontrado.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTournaments.map((tournament) => {
                  const config = STATUS_CONFIG[tournament.status];
                  const progress = tournament.maxTeams
                    ? (tournament.teams / tournament.maxTeams) * 100
                    : 0;
                  return (
                    <Link
                      key={tournament.id}
                      to={`/tournaments/${tournament.id}`}
                      className="block px-6 py-5 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {tournament.name}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1.5">
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
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  {tournament.date}
                                </span>
                                <span>·</span>
                                <span>{tournament.category}</span>
                              </div>
                            </div>
                            <span
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                              />
                              {tournament.status}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-600">
                              <span>{tournament.teams} duplas</span>
                            </div>
                          </div>
                        </div>
                      </div>
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
