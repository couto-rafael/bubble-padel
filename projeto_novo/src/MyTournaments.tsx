import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import { useTournaments } from "./hooks";
import type { Tournament } from "./types";

// ─── helper: formatar data ────────────────────────────────
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── helper: determinar status visual ────────────────────
const getStatusDisplay = (tournament: Tournament) => {
  const now = new Date();
  const regStart = new Date(tournament.registrationStartDate);
  const regEnd = new Date(tournament.registrationEndDate);
  const tStart = new Date(tournament.startDate);

  if (tournament.status === "draft") {
    return {
      label: "Rascunho",
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-400",
    };
  }
  if (tournament.status === "ongoing") {
    return {
      label: "Em Andamento",
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    };
  }
  if (tournament.status === "completed") {
    return {
      label: "Concluído",
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    };
  }
  if (tournament.status === "published") {
    if (now < regStart)
      return {
        label: "Agendado",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    if (now >= regStart && now <= regEnd)
      return {
        label: "Inscrições Abertas",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    if (now > regEnd && now < tStart)
      return {
        label: "Inscrições Encerradas",
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
  }
  return {
    label: "Agendado",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  };
};

// ─── status badge ─────────────────────────────────────────
const StatusBadge = ({ tournament }: { tournament: Tournament }) => {
  const style = getStatusDisplay(tournament);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

// ─── tournament card ──────────────────────────────────────
const TournamentCard = ({
  tournament,
  onDelete,
}: {
  tournament: Tournament;
  onDelete: (id: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex-1 pr-3">
          {tournament.name}
        </h3>
        <StatusBadge tournament={tournament} />
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <svg
            className="w-4 h-4 text-blue-600 flex-shrink-0"
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
          <span>
            {formatDate(tournament.startDate)} -{" "}
            {formatDate(tournament.endDate)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <svg
            className="w-4 h-4 text-blue-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span>{tournament.totalTeams} duplas</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <svg
            className="w-4 h-4 text-blue-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>R$ {tournament.priceFirstCategory.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <svg
            className="w-4 h-4 text-blue-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{tournament.clubSede}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Categorias:</p>
        <div className="flex flex-wrap gap-2">
          {tournament.categories.slice(0, 3).map((cat, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700"
            >
              {cat}
            </span>
          ))}
          {tournament.categories.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              +{tournament.categories.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
        <Link
          to={`/dashboard/tournaments/${tournament.id}/edit`}
          className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar
        </Link>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-lg transition-all"
          title="Excluir"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Excluir Torneio
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir <strong>{tournament.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDelete(tournament.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── main component ───────────────────────────────────────
const MyTournaments = () => {
  const { tournaments, loading, deleteTournament } = useTournaments();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "todos" | "rascunho" | "publicado" | "em-andamento" | "concluido"
  >("todos");

  const counts = {
    todos: tournaments.length,
    rascunho: tournaments.filter((t) => t.status === "draft").length,
    publicado: tournaments.filter((t) => t.status === "published").length,
    "em-andamento": tournaments.filter((t) => t.status === "ongoing").length,
    concluido: tournaments.filter((t) => t.status === "completed").length,
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "rascunho" && tournament.status === "draft") ||
      (activeTab === "publicado" && tournament.status === "published") ||
      (activeTab === "em-andamento" && tournament.status === "ongoing") ||
      (activeTab === "concluido" && tournament.status === "completed");
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando torneios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader activePage="tournaments" />
      <main className="pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meus Torneios
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie todos os seus torneios
              </p>
            </div>
            <Link
              to="/dashboard/tournaments/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Criar Torneio
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome do torneio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-x-auto">
            <div className="flex border-b border-gray-200 min-w-max">
              {[
                { key: "todos", label: "Todos", count: counts.todos },
                { key: "rascunho", label: "Rascunho", count: counts.rascunho },
                {
                  key: "publicado",
                  label: "Publicados",
                  count: counts.publicado,
                },
                {
                  key: "em-andamento",
                  label: "Em Andamento",
                  count: counts["em-andamento"],
                },
                {
                  key: "concluido",
                  label: "Concluídos",
                  count: counts.concluido,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-4 text-sm font-semibold transition-colors relative ${activeTab === tab.key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  {tab.label} ({tab.count})
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onDelete={deleteTournament}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Nenhum torneio encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando seu primeiro torneio"}
              </p>
              {!searchQuery && (
                <Link
                  to="/dashboard/tournaments/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Criar Torneio
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyTournaments;
