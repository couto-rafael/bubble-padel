import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";

// ─── Types ─────────────────────────────────────────────────
interface Tournament {
  id: string;
  name: string;
  date: string;
  status: "Rascunho" | "Aberto" | "Em Andamento" | "Finalizado";
  teams: number;
  maxTeams: number;
  category: string;
}

interface Activity {
  id: string;
  type: "created" | "registered" | "finished" | "payment" | "started";
  title: string;
  detail: string;
  time: string;
}

// ─── Mock Data ─────────────────────────────────────────────
const TOURNAMENTS: Tournament[] = [
  {
    id: "1",
    name: "Campeonato Primavera Open 2026",
    date: "12–14 Mar 2026",
    status: "Aberto",
    teams: 24,
    maxTeams: 32,
    category: "Elite",
  },
  {
    id: "2",
    name: "Copa Inverno Série B",
    date: "20–22 Mar 2026",
    status: "Rascunho",
    teams: 0,
    maxTeams: 24,
    category: "Intermediário",
  },
  {
    id: "3",
    name: "League Semanal – Rodada 4",
    date: "01 Mar 2026",
    status: "Em Andamento",
    teams: 12,
    maxTeams: 12,
    category: "Avançado",
  },
  {
    id: "4",
    name: "Torneio de Estreia 2026",
    date: "05–06 Fev 2026",
    status: "Finalizado",
    teams: 16,
    maxTeams: 16,
    category: "Iniciante",
  },
];

const ACTIVITIES: Activity[] = [
  {
    id: "1",
    type: "registered",
    title: "Nova dupla inscrita",
    detail: "Rafael Souza / Beatriz Alves – Primavera Open",
    time: "2h atrás",
  },
  {
    id: "2",
    type: "payment",
    title: "Pagamento confirmado",
    detail: "R$ 150,00 – Dupla 14",
    time: "3h atrás",
  },
  {
    id: "3",
    type: "finished",
    title: "Partida finalizada",
    detail: "Quadra 1 – 6-4, 6-3",
    time: "5h atrás",
  },
  {
    id: "4",
    type: "started",
    title: "Torneio iniciou",
    detail: "League Semanal – Rodada 4",
    time: "1d atrás",
  },
  {
    id: "5",
    type: "registered",
    title: "Nova dupla inscrita",
    detail: "Lucas Ferreira / Camila Rocha – Primavera Open",
    time: "1d atrás",
  },
  {
    id: "6",
    type: "created",
    title: "Torneio criado",
    detail: "Copa Inverno Série B",
    time: "2d atrás",
  },
];

// ─── Style Configurations ──────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> =
  {
    Rascunho: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-400",
    },
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

const ACTIVITY_CONFIG: Record<
  Activity["type"],
  { bg: string; icon: string; iconPath: string }
> = {
  created: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    iconPath: "M12 4v16m8-8H4",
  },
  registered: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    iconPath:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  finished: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  payment: {
    bg: "bg-green-50",
    icon: "text-green-600",
    iconPath:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  started: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
  },
};

// ─── Components ────────────────────────────────────────────

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

  // Calculate stats
  const activeTournaments = TOURNAMENTS.filter(
    (t) => t.status === "Aberto" || t.status === "Em Andamento",
  ).length;
  const totalParticipants = TOURNAMENTS.reduce(
    (sum, t) => sum + t.teams * 2,
    0,
  );

  // Filter tournaments
  const filteredTournaments =
    selectedFilter === "Todos"
      ? TOURNAMENTS
      : TOURNAMENTS.filter((t) => t.status === selectedFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader activePage="dashboard" />

      <main className="pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Bem-vindo de volta! 👋
                </h1>
                <p className="text-gray-600">
                  Aqui está um resumo das suas atividades hoje
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Sábado, 08 Fev 2026
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Última atualização: há 5 minutos
                </p>
              </div>
            </div>
          </div>

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
              value="4"
              subtitle="+2 este mês"
              trend="up"
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
              value={activeTournaments}
              subtitle={`${activeTournaments} em andamento`}
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
              value="104"
              subtitle="+15% vs mês anterior"
              trend="up"
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
              title="Jogos Registrados"
              value="12"
              subtitle="8 finalizados"
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

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tournaments List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
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

                  {/* Filters */}
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

                {/* Tournament List */}
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
                          {/* Tournament Info */}
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

                              {/* Status Badge */}
                              <span
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                                />
                                {tournament.status}
                              </span>
                            </div>

                            {/* Progress */}
                            <div>
                              <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                                <span>
                                  {tournament.teams} de {tournament.maxTeams}{" "}
                                  equipes
                                </span>
                                <span className="text-gray-900">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    progress >= 75
                                      ? "bg-emerald-500"
                                      : progress >= 50
                                        ? "bg-blue-500"
                                        : progress >= 25
                                          ? "bg-amber-500"
                                          : "bg-gray-300"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-emerald-600"
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
                    <h2 className="text-base font-bold text-gray-900">
                      Atividades Recentes
                    </h2>
                  </div>
                </div>

                {/* Activity List */}
                <div className="divide-y divide-gray-100">
                  {ACTIVITIES.map((activity) => {
                    const config = ACTIVITY_CONFIG[activity.type];
                    return (
                      <div
                        key={activity.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex gap-3">
                          <div
                            className={`${config.bg} p-2 rounded-lg flex-shrink-0 h-fit`}
                          >
                            <svg
                              className={`w-4 h-4 ${config.icon}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d={config.iconPath}
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 mb-0.5">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {activity.detail}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClubDashboard;
