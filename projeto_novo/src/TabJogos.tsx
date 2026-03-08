import { useState, useMemo } from "react";
import type { Team, Group, Match } from "./utils/groupUtils";
import { useGroups, useSchedule } from "./hooks";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Tournament {
  id: string;
  name: string;
  categories: string[];
  status: string;
  courts?: string[]; // quadras do torneio
}

interface ScheduledMatch {
  match: Match;
  group: Group;
  court: string | null;
  date: string | null; // ISO date string "2025-03-15"
  time: string | null; // "14:00"
  matchIndex: number; // posição no grupo para exibição
}

interface TabJogosProps {
  teams: Team[];
  tournament: Tournament;
  groups: Group[];
}

// Quadras padrão caso o torneio não tenha definido
const DEFAULT_COURTS = ["Quadra 1", "Quadra 2", "Quadra 3", "Quadra 4"];

// Cores para cada quadra
const COURT_COLORS = [
  {
    dot: "bg-blue-500",
    active: "bg-blue-600 text-white border-blue-600",
    inactive:
      "text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600",
  },
  {
    dot: "bg-orange-500",
    active: "bg-orange-500 text-white border-orange-500",
    inactive:
      "text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600",
  },
  {
    dot: "bg-violet-500",
    active: "bg-violet-600 text-white border-violet-600",
    inactive:
      "text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600",
  },
  {
    dot: "bg-emerald-500",
    active: "bg-emerald-600 text-white border-emerald-600",
    inactive:
      "text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600",
  },
  {
    dot: "bg-rose-500",
    active: "bg-rose-600 text-white border-rose-600",
    inactive:
      "text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600",
  },
  {
    dot: "bg-cyan-500",
    active: "bg-cyan-600 text-white border-cyan-600",
    inactive:
      "text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-cyan-600",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getTeamNames(
  groups: Group[],
  teamId: string,
): { p1: string; p2: string } {
  for (const g of groups) {
    const gt = g.teams.find((t) => t.team.id === teamId);
    if (gt) return { p1: gt.team.player1Name, p2: gt.team.player2Name };
  }
  return { p1: "Atleta 1", p2: "Atleta 2" };
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function matchLabel(group: Group, matchIndex: number) {
  return `${group.name} · Jogo ${matchIndex + 1}`;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function TabJogos({
  teams,
  tournament,
}: Omit<TabJogosProps, "groups">) {
  const courts = tournament.courts?.length ? tournament.courts : DEFAULT_COURTS;

  // Busca grupos diretamente do backend — garante sincronismo com TabGrupos
  const { groups } = useGroups(tournament.id);

  // ── Estado dos filtros ────────────────────────────────────────────────────
  const [courtFilter, setCourtFilter] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "pendente" | "concluido"
  >("todos");

  // ── Estado de agendamento ─────────────────────────────────────────────────
  // Guarda { [matchId]: { court, date, time } }
  const { schedule, updateSchedule } = useSchedule(tournament.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ court: "", date: "", time: "" });

  // ── Extrai todos os jogos de todos os grupos ───────────────────────────────
  const allMatches = useMemo<ScheduledMatch[]>(() => {
    const result: ScheduledMatch[] = [];
    for (const group of groups) {
      group.matches.forEach((match, idx) => {
        const s = schedule[match.id];
        result.push({
          match,
          group,
          court: s?.court || null,
          date: s?.date || null,
          time: s?.time || null,
          matchIndex: idx,
        });
      });
    }
    result.sort((a, b) => {
      const da = `${a.date ?? "9999"} ${a.time ?? "99:99"}`;
      const db = `${b.date ?? "9999"} ${b.time ?? "99:99"}`;
      return da.localeCompare(db);
    });
    return result;
  }, [groups, schedule]);

  // ── Filtros aplicados ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allMatches.filter((sm) => {
      // Filtro quadra
      if (courtFilter !== "todas" && sm.court !== courtFilter) return false;
      // Filtro categoria
      if (categoryFilter !== "todas" && sm.group.category !== categoryFilter)
        return false;
      // Filtro data
      if (dateFilter && sm.date !== dateFilter) return false;
      // Filtro status
      if (statusFilter === "pendente" && sm.match.played) return false;
      if (statusFilter === "concluido" && !sm.match.played) return false;
      // Busca por atleta
      if (q) {
        const { p1: t1p1, p2: t1p2 } = getTeamNames(groups, sm.match.team1Id);
        const { p1: t2p1, p2: t2p2 } = getTeamNames(groups, sm.match.team2Id);
        const hay = [t1p1, t1p2, t2p1, t2p2].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allMatches,
    courtFilter,
    categoryFilter,
    dateFilter,
    statusFilter,
    searchQuery,
    groups,
  ]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total = allMatches.length;
  const played = allMatches.filter((sm) => sm.match.played).length;
  const pending = total - played;

  // ── Agendamento ───────────────────────────────────────────────────────────
  const openEdit = (matchId: string) => {
    const s = schedule[matchId] || { court: courts[0], date: "", time: "" };
    setEditForm(s);
    setEditingId(matchId);
  };

  const saveEdit = async (matchId: string) => {
    if (editForm.court || editForm.date || editForm.time) {
      await updateSchedule(matchId, {
        court: editForm.court,
        date: editForm.date,
        time: editForm.time,
      });
    }
    setEditingId(null);
  };

  // ── Score display helper ──────────────────────────────────────────────────
  const renderScore = (match: Match) => {
    if (!match.played)
      return (
        <span className="text-gray-300 font-black text-sm tabular-nums">
          — × —
        </span>
      );
    const sets = (match as any).sets as
      | Array<{ s1: number; s2: number }>
      | undefined;
    if (sets && sets.length > 0) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          {sets.map((s, i) => (
            <span
              key={i}
              className="font-black text-sm tabular-nums text-gray-800 leading-snug"
            >
              {s.s1} × {s.s2}
            </span>
          ))}
          {match.wo && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              W.O.
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-black text-sm tabular-nums text-gray-800">
          {match.score1} × {match.score2}
        </span>
        {match.wo && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            W.O.
          </span>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: sem grupos gerados
  // ─────────────────────────────────────────────────────────────────────────

  if (groups.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-14 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Nenhum jogo programado
        </h3>
        <p className="text-gray-500 text-sm">
          Gere os grupos na aba <strong>Grupos</strong> para que os jogos
          apareçam aqui.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: jogos disponíveis
  // ─────────────────────────────────────────────────────────────────────────

  const hasActiveFilters =
    courtFilter !== "todas" ||
    categoryFilter !== "todas" ||
    dateFilter ||
    statusFilter !== "todos" ||
    searchQuery;

  return (
    <div className="space-y-5">
      {/* ── Filtro de Quadras (tabs horizontais) ─────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quadras
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 pb-4 overflow-x-auto">
          {/* Todas */}
          <button
            onClick={() => setCourtFilter("todas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              courtFilter === "todas"
                ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                : "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
            }`}
          >
            Todas as quadras
            <span
              className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full font-bold ${courtFilter === "todas" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {total}
            </span>
          </button>

          {courts.map((court, idx) => {
            const color = COURT_COLORS[idx % COURT_COLORS.length];
            const courtMatches = allMatches.filter((sm) => sm.court === court);
            const isActive = courtFilter === court;
            return (
              <button
                key={court}
                onClick={() => setCourtFilter(isActive ? "todas" : court)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive ? color.active + " shadow-sm" : color.inactive
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-white/80" : color.dot}`}
                />
                {court}
                {courtMatches.length > 0 && (
                  <span
                    className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    {courtMatches.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Linha de progresso geral */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: total > 0 ? `${(played / total) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0 tabular-nums">
            <span className="font-semibold text-emerald-600">{played}</span> /{" "}
            {total} jogos realizados
          </span>
          {pending > 0 && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {pending} pendentes
            </span>
          )}
        </div>
      </div>

      {/* ── Toolbar de busca + filtros ────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
              placeholder="Buscar atleta pelo nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todas">Todas categorias</option>
            {tournament.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Data */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-40 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todos">Todos os jogos</option>
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
          </select>
        </div>

        {/* Footer: resultado + limpar */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {filtered.length === total ? (
              <>
                {total} jogo{total !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-800">
                  {filtered.length}
                </span>{" "}
                de {total} jogos
              </>
            )}
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setCourtFilter("todas");
                setCategoryFilter("todas");
                setDateFilter("");
                setStatusFilter("todos");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Lista de Jogos ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <svg
            className="w-10 h-10 text-gray-200 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-500 font-semibold">Nenhum jogo encontrado</p>
          <p className="text-gray-400 text-sm mt-1">
            Ajuste os filtros acima para ver os jogos
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sm) => {
            const { p1: t1p1, p2: t1p2 } = getTeamNames(
              groups,
              sm.match.team1Id,
            );
            const { p1: t2p1, p2: t2p2 } = getTeamNames(
              groups,
              sm.match.team2Id,
            );
            const sets = (sm.match as any).sets as
              | Array<{ s1: number; s2: number }>
              | undefined;
            const wins1 = sets
              ? sets.filter((s) => s.s1 > s.s2).length
              : sm.match.score1 !== null &&
                  sm.match.score2 !== null &&
                  sm.match.score1 > sm.match.score2
                ? 1
                : 0;
            const wins2 = sets
              ? sets.filter((s) => s.s2 > s.s1).length
              : sm.match.score1 !== null &&
                  sm.match.score2 !== null &&
                  sm.match.score2 > sm.match.score1
                ? 1
                : 0;
            const win1 = sm.match.played && wins1 > wins2;
            const win2 = sm.match.played && wins2 > wins1;

            const courtIdx = courts.indexOf(sm.court || "");
            const courtColor =
              courtIdx >= 0
                ? COURT_COLORS[courtIdx % COURT_COLORS.length]
                : null;
            const isEditing = editingId === sm.match.id;

            return (
              <div
                key={sm.match.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  sm.match.played ? "border-gray-100" : "border-gray-200"
                }`}
              >
                {/* ── Linha principal do jogo ─────────────────────────── */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Info do jogo (grupo + quadra + data) */}
                  <div className="shrink-0 w-28 flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-gray-500 truncate">
                      {matchLabel(sm.group, sm.matchIndex)}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-500 truncate">
                      {sm.group.category}
                    </span>
                    {sm.court ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold truncate ${courtColor ? "text-gray-600" : "text-gray-400"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${courtColor?.dot || "bg-gray-300"}`}
                        />
                        {sm.court}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">
                        Sem quadra
                      </span>
                    )}
                    {sm.date ? (
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {formatDate(sm.date)}
                        {sm.time ? ` · ${sm.time}` : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">
                        Sem horário
                      </span>
                    )}
                  </div>

                  {/* Dupla 1 */}
                  <div
                    className={`flex-1 text-right min-w-0 ${win1 ? "" : "opacity-60"}`}
                  >
                    <p
                      className={`text-sm leading-tight truncate ${win1 ? "font-semibold text-gray-900" : "text-gray-600"}`}
                    >
                      {t1p1}
                    </p>
                    <p
                      className={`text-sm leading-tight truncate mt-0.5 ${win1 ? "font-semibold text-gray-900" : "text-gray-500"}`}
                    >
                      {t1p2}
                    </p>
                  </div>

                  {/* Placar */}
                  <div className="shrink-0 flex flex-col items-center min-w-[60px]">
                    {renderScore(sm.match)}
                    {!sm.match.played && (
                      <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 mt-1 whitespace-nowrap">
                        A realizar
                      </span>
                    )}
                  </div>

                  {/* Dupla 2 */}
                  <div
                    className={`flex-1 text-left min-w-0 ${win2 ? "" : "opacity-60"}`}
                  >
                    <p
                      className={`text-sm leading-tight truncate ${win2 ? "font-semibold text-gray-900" : "text-gray-600"}`}
                    >
                      {t2p1}
                    </p>
                    <p
                      className={`text-sm leading-tight truncate mt-0.5 ${win2 ? "font-semibold text-gray-900" : "text-gray-500"}`}
                    >
                      {t2p2}
                    </p>
                  </div>

                  {/* Ação: agendar */}
                  <button
                    onClick={() =>
                      isEditing ? setEditingId(null) : openEdit(sm.match.id)
                    }
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isEditing
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    }`}
                    title="Agendar jogo"
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
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                      />
                    </svg>
                  </button>
                </div>

                {/* ── Painel de agendamento (expandido) ──────────────── */}
                {isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                      Agendar jogo
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Quadra */}
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                          Quadra
                        </label>
                        <select
                          value={editForm.court}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              court: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Sem quadra</option>
                          {courts.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Data */}
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                          Data
                        </label>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, date: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      {/* Horário */}
                      <div className="w-32">
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                          Horário
                        </label>
                        <input
                          type="time"
                          value={editForm.time}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, time: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      {/* Botões */}
                      <div className="flex items-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            await saveEdit(sm.match.id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
