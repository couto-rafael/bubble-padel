import { useGroups, useClub, usePlayoffs, useSchedule } from "./hooks";
import { useState, useRef } from "react";
import type { Team, Group, GroupTeam, Match } from "./types";
import ScoreModal from "./ScoreModal";
import {
  generateGroupsForCategory,
  recalculateStandings,
  tournamentHasStarted,
} from "./utils/groupUtils";
import {
  buildSeeds,
  generateBracketMatches,
  generateAutoSchedule,
  buildDaySchedules,
} from "./utils/scheduleUtils";
import { GroupService, PlayoffService, ScheduleService } from "./services/api";
import type { PlayoffBracketData, PlayoffMatchData } from "./services/api";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Tournament {
  id: string;
  name: string;
  categories: string[];
  status: string;
  startDate?: string;
  endDate?: string;
  priceFirstCategory?: number;
  maxTeams?: number;
  courts?: string[];
  matchDuration?: number;
  daySchedules?: Array<{ date: string; startTime: string; endTime: string }>;
}

interface TabGruposProps {
  teams: Team[];
  tournament: Tournament;
  onGroupsChange?: (groups: Group[]) => void;
}

// ─── PALETA DE CORES POR CATEGORIA ───────────────────────────────────────────

const CAT_COLORS = [
  {
    header: "bg-violet-600",
    badge: "bg-violet-500",
    dragBorder: "border-violet-400 shadow-violet-100",
  },
  {
    header: "bg-blue-600",
    badge: "bg-blue-500",
    dragBorder: "border-blue-400 shadow-blue-100",
  },
  {
    header: "bg-emerald-600",
    badge: "bg-emerald-500",
    dragBorder: "border-emerald-400 shadow-emerald-100",
  },
  {
    header: "bg-rose-600",
    badge: "bg-rose-500",
    dragBorder: "border-rose-400 shadow-rose-100",
  },
  {
    header: "bg-amber-500",
    badge: "bg-amber-400",
    dragBorder: "border-amber-400 shadow-amber-100",
  },
  {
    header: "bg-cyan-600",
    badge: "bg-cyan-500",
    dragBorder: "border-cyan-400 shadow-cyan-100",
  },
];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

const getRoundLabel = (roundSize: number): string => {
  if (roundSize === 1) return "Final";
  if (roundSize === 2) return "Semifinal";
  if (roundSize === 4) return "Quartas de Final";
  if (roundSize === 8) return "Oitavas de Final";
  if (roundSize === 16) return "16avos de Final";
  if (roundSize === 32) return "32avos de Final";
  if (roundSize === 64) return "64avos de Final";
  return `Fase ${roundSize}`;
};

const COURT_COLORS = [
  { dot: "bg-blue-500" },
  { dot: "bg-orange-500" },
  { dot: "bg-violet-500" },
  { dot: "bg-emerald-500" },
  { dot: "bg-rose-500" },
  { dot: "bg-cyan-500" },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function TabGrupos({
  teams,
  tournament,
  onGroupsChange,
}: TabGruposProps) {
  const {
    groups,
    setGroups: saveGroups,
    saveGroupsImmediate,
    saveScore,
    resetGroups,
    loading: groupsLoading,
  } = useGroups(tournament.id);

  const setGroups = (val: Group[] | ((prev: Group[]) => Group[])) => {
    saveGroups((prev: Group[]) => {
      const next = typeof val === "function" ? val(prev) : val;
      onGroupsChange?.(next);
      return next;
    });
  };

  const generated = groups.length > 0;

  // Playoffs e schedule — para listar jogos de playoff por categoria
  const {
    brackets,
    saveMatchResult,
    reload: reloadBrackets,
  } = usePlayoffs(tournament.id);
  const { schedule, updateSchedule } = useSchedule(tournament.id);
  const [playoffScoreModal, setPlayoffScoreModal] =
    useState<PlayoffMatchData | null>(null);
  const [scoreModal, setScoreModal] = useState<{
    open: boolean;
    groupId: string;
    match: Match | null;
  }>({ open: false, groupId: "", match: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");

  const dragTeam = useRef<{ groupId: string; teamId: string } | null>(null);
  const locked = tournamentHasStarted(groups);

  const { club } = useClub();

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const confirmedTeams = teams.filter((t) => t.status === "confirmed");
    if (confirmedTeams.length === 0) {
      alert("Não há duplas confirmadas para gerar grupos.");
      return;
    }

    setGenerating(true);
    try {
      // 1. Gerar grupos localmente
      const allGroups: Group[] = [];
      tournament.categories.forEach((cat, idx) => {
        const catTeams = confirmedTeams.filter((t) => t.category === cat);
        if (catTeams.length === 0) return;
        allGroups.push(...generateGroupsForCategory(cat, catTeams, idx));
      });

      // 2. Salvar grupos no backend e obter IDs dos jogos
      const savedGroups = await saveGroupsImmediate(allGroups);

      // 3. Gerar e salvar brackets de playoff para cada categoria
      const playoffBrackets: Array<{
        category: string;
        matches: Array<{ id: string; roundSize: number; isBye: boolean }>;
      }> = [];

      for (const cat of tournament.categories) {
        const catGroups = savedGroups.filter((g) => g.category === cat);
        if (catGroups.length === 0) continue;
        const seeds = buildSeeds(catGroups);
        if (seeds.length < 2) continue;
        const bracketMatches = generateBracketMatches(seeds);
        try {
          const saved = await PlayoffService.save(
            tournament.id,
            cat,
            bracketMatches,
          );
          playoffBrackets.push({
            category: saved.category,
            matches: saved.matches.map((m) => ({
              id: m.id,
              roundSize: m.roundSize,
              isBye: m.isBye,
            })),
          });
        } catch (e) {
          console.error(`Erro ao salvar bracket de ${cat}:`, e);
        }
      }

      // 4. Agendar automaticamente se o torneio tem quadras e horários por dia
      const hasCourts = tournament.courts && tournament.courts.length > 0;
      const matchDuration =
        tournament.matchDuration ?? club?.matchDuration ?? 60;

      // Usa daySchedules do torneio; fallback para clube se não tiver
      const extractDate = (d?: string) => (d ? d.slice(0, 10) : null);
      const startDate = extractDate(tournament.startDate);
      const endDate = extractDate(tournament.endDate);

      const daySchedules: Array<{
        date: string;
        startTime: string;
        endTime: string;
      }> =
        tournament.daySchedules && tournament.daySchedules.length > 0
          ? tournament.daySchedules
          : buildDaySchedules(
              startDate ?? "",
              endDate ?? "",
              club?.defaultStartTime ?? "08:00",
              club?.defaultEndTime ?? "20:00",
            );

      console.log(
        "[schedule] matchDuration:",
        matchDuration,
        "daySchedules:",
        daySchedules,
      );

      if (hasCourts && daySchedules.length > 0) {
        // Coletar jogos de grupo com IDs
        const groupMatchInputs = savedGroups.flatMap((g) =>
          (g.matches ?? [])
            .filter((m) => m.team1Id && m.team2Id)
            .map((m) => ({
              id: m.id,
              team1Id: m.team1Id as string,
              team2Id: m.team2Id as string,
              category: g.category,
            })),
        );

        // Rodar algoritmo com grupos E playoffs
        const scheduleEntries = generateAutoSchedule(
          groupMatchInputs,
          playoffBrackets,
          tournament.courts!,
          daySchedules,
          matchDuration,
        );

        // Salvar em lote
        if (scheduleEntries.length > 0) {
          await ScheduleService.bulkUpdate(tournament.id, scheduleEntries);
        }
      }

      // Recarrega brackets e schedule para reflectir no UI imediatamente
      await reloadBrackets();
      onGroupsChange?.(savedGroups);
    } catch (err) {
      console.error("Erro ao gerar grupos:", err);
      alert("Erro ao gerar grupos. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Deseja refazer os grupos? Todos os sorteios serão perdidos.",
      )
    )
      return;
    await resetGroups();
    onGroupsChange?.([]);
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const handleDragStart = (groupId: string, teamId: string) => {
    dragTeam.current = { groupId, teamId };
  };

  const handleDropOnGroup = (targetGroupId: string) => {
    if (!dragTeam.current || locked) return;
    const { groupId: srcId, teamId } = dragTeam.current;
    if (srcId === targetGroupId) return;
    const src = groups.find((g) => g.id === srcId);
    const tgt = groups.find((g) => g.id === targetGroupId);
    if (!src || !tgt) return;
    const moving = src.teams.find((gt) => gt.team.id === teamId);
    if (!moving) return;
    const newSrcTeams = src.teams.filter((gt) => gt.team.id !== teamId);
    const newTgtTeams = [
      ...tgt.teams,
      {
        ...moving,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        saldo: 0,
        gamesPlayed: 0,
        qualified: false,
      },
    ];
    setGroups(
      groups.map((g: Group) => {
        if (g.id === srcId)
          return recalculateStandings({
            ...g,
            teams: newSrcTeams,
            matches: regen(g.id, newSrcTeams),
          });
        if (g.id === targetGroupId)
          return recalculateStandings({
            ...g,
            teams: newTgtTeams,
            matches: regen(g.id, newTgtTeams),
          });
        return g;
      }),
    );
    dragTeam.current = null;
  };

  const regen = (gid: string, t: GroupTeam[]): Match[] => {
    const mk = (i: number, a: string, b: string): Match => ({
      id: `${gid}_m${i}`,
      groupId: gid,
      team1Id: a,
      team2Id: b,
      score1: null,
      score2: null,
      played: false,
    });
    if (t.length < 2) return [];
    if (t.length === 2) return [mk(0, t[0].team.id, t[1].team.id)];
    if (t.length === 3)
      return [
        mk(0, t[0].team.id, t[1].team.id),
        mk(1, t[1].team.id, t[2].team.id),
        mk(2, t[2].team.id, t[0].team.id),
      ];
    if (t.length === 4)
      return [
        mk(0, t[0].team.id, t[1].team.id),
        mk(1, t[2].team.id, t[3].team.id),
        mk(2, t[1].team.id, t[2].team.id),
        mk(3, t[3].team.id, t[0].team.id),
        mk(4, t[2].team.id, t[0].team.id),
        mk(5, t[1].team.id, t[3].team.id),
      ];
    return [];
  };

  // ── Resultado ─────────────────────────────────────────────────────────────

  const openScoreModal = (groupId: string, match: Match) => {
    setScoreModal({ open: true, groupId, match });
  };

  const getTeamName = (group: Group, teamId: string) => {
    const gt = group.teams.find((t) => t.team.id === teamId);
    return gt ? `${gt.team.player1Name} / ${gt.team.player2Name}` : "Dupla";
  };

  // ── Dados derivados ───────────────────────────────────────────────────────

  const confirmedByCategory = tournament.categories.reduce<
    Record<string, number>
  >((acc, cat) => {
    acc[cat] = teams.filter(
      (t) => t.category === cat && t.status === "confirmed",
    ).length;
    return acc;
  }, {});
  const totalConfirmed = Object.values(confirmedByCategory).reduce(
    (a, b) => a + b,
    0,
  );

  const groupsByCategory = tournament.categories.reduce<
    Record<string, Group[]>
  >((acc, cat) => {
    const cg = groups.filter((g) => g.category === cat);
    if (cg.length > 0) acc[cat] = cg;
    return acc;
  }, {});

  // Aplica filtros
  const filteredGroupsByCategory = Object.entries(groupsByCategory).reduce<
    Record<string, Group[]>
  >((acc, [cat, catGroups]) => {
    if (categoryFilter !== "todas" && cat !== categoryFilter) return acc;
    const q = searchQuery.toLowerCase().trim();
    const matching = q
      ? catGroups.filter((g) =>
          g.teams.some(
            (gt) =>
              gt.team.player1Name.toLowerCase().includes(q) ||
              gt.team.player2Name.toLowerCase().includes(q),
          ),
        )
      : catGroups;
    if (matching.length > 0) acc[cat] = matching;
    return acc;
  }, {});

  const catColorIdx = (cat: string) => tournament.categories.indexOf(cat);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: estado vazio
  // ─────────────────────────────────────────────────────────────────────────

  if (!generated) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Duplas confirmadas por categoria
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tournament.categories.map((cat, idx) => {
              const color = CAT_COLORS[idx % CAT_COLORS.length];
              return (
                <div
                  key={cat}
                  className="bg-white rounded-lg px-4 py-3 flex items-center justify-between border border-gray-200"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${color.badge}`}
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {cat}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ml-2 ${confirmedByCategory[cat] === 0 ? "text-gray-400" : "text-blue-600"}`}
                  >
                    {confirmedByCategory[cat]}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Total confirmadas: <strong>{totalConfirmed}</strong> duplas. Apenas
            duplas com status "Confirmada" entram nos grupos.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-14 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
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
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Grupos não gerados
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
            Os grupos serão sorteados automaticamente por categoria.
          </p>
          <button
            onClick={handleGenerate}
            disabled={totalConfirmed === 0 || generating}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "⏳ Gerando..." : "⚡ Gerar Grupos Automaticamente"}
          </button>
          {totalConfirmed === 0 && (
            <p className="text-xs text-red-500 mt-3">
              Nenhuma dupla confirmada na aba Inscrições.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: grupos gerados
  // ─────────────────────────────────────────────────────────────────────────

  const visibleCount = Object.values(filteredGroupsByCategory).flat().length;

  return (
    <div className="space-y-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Abas de categoria — scroll horizontal se necessário */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center min-w-max px-4">
            <button
              onClick={() => setCategoryFilter("todas")}
              className={`relative px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === "todas"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Todas
              {categoryFilter === "todas" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
            {tournament.categories
              .filter((c) => groupsByCategory[c])
              .map((cat) => {
                const groupCount = (groupsByCategory[cat] || []).length;
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`relative flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                      active
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {cat.toUpperCase()}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Busca + ações */}
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
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
                className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Filtro categoria (dropdown — mantido para compatibilidade) */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-52 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="todas">Todas as categorias</option>
              {tournament.categories
                .filter((c) => groupsByCategory[c])
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>

            {/* Status badges + Refazer */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {groups.length} grupo{groups.length !== 1 ? "s" : ""}
                {(searchQuery || categoryFilter !== "todas") &&
                visibleCount !== groups.length
                  ? ` · ${visibleCount} visíveis`
                  : ""}
              </span>
              {locked && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                  🔒 Bloqueado
                </span>
              )}
              {!locked && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refazer
                </button>
              )}
            </div>
          </div>

          {!locked && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              Arraste duplas entre grupos para reorganizar (bloqueado após o
              primeiro resultado)
            </p>
          )}
        </div>
      </div>

      {/* ── Grupos ───────────────────────────────────────────────────────── */}
      {Object.keys(filteredGroupsByCategory).length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <svg
            className="w-10 h-10 text-gray-300 mx-auto mb-3"
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
          <p className="text-gray-500 font-semibold">Nenhum grupo encontrado</p>
          <p className="text-gray-400 text-sm mt-1">
            Tente ajustar a busca ou o filtro
          </p>
        </div>
      ) : (
        Object.entries(filteredGroupsByCategory).map(
          ([category, catGroups]) => {
            const ci = catColorIdx(category);
            const color = CAT_COLORS[ci % CAT_COLORS.length];
            return (
              <div key={category} className="space-y-3">
                {categoryFilter === "todas" && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${color.badge}`}
                    />
                    <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                      {category}
                    </h2>
                    <span className="text-xs text-gray-400">
                      {catGroups.length} grupo
                      {catGroups.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {catGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      category={category}
                      colorIdx={ci}
                      locked={locked}
                      searchQuery={searchQuery}
                      schedule={schedule}
                      onDragStart={handleDragStart}
                      onDrop={handleDropOnGroup}
                      onOpenScore={openScoreModal}
                      getTeamName={(id) => getTeamName(group, id)}
                    />
                  ))}
                </div>

                {/* ── Jogos de Playoff desta categoria ──────────────── */}
                {(() => {
                  const catBracket = brackets.find(
                    (b) => b.category === category,
                  );
                  if (!catBracket) return null;
                  const playoffMatches = catBracket.matches
                    .filter((m) => !m.isBye)
                    .sort((a, b) =>
                      b.roundSize !== a.roundSize
                        ? b.roundSize - a.roundSize
                        : a.matchIndex - b.matchIndex,
                    );
                  if (playoffMatches.length === 0) return null;
                  return (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                          Playoffs — {category}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {playoffMatches.filter((m) => m.played).length}/
                          {playoffMatches.length} jogos
                        </span>
                      </div>
                      <div className="space-y-2">
                        {playoffMatches.map((pm) => {
                          const t1 = pm.team1Label ?? "A definir";
                          const t2 = pm.team2Label ?? "A definir";
                          const [t1a, t1b] = t1.split(" / ");
                          const [t2a, t2b] = t2.split(" / ");
                          const win1 = pm.played && pm.winnerId === pm.team1Id;
                          const win2 = pm.played && pm.winnerId === pm.team2Id;
                          const s = schedule[pm.id];
                          const roundLabel = getRoundLabel(pm.roundSize);
                          const isClickable = !!pm.team1Id && !!pm.team2Id;
                          const allCourts = tournament.courts ?? [];
                          const courtIdx = allCourts.indexOf(s?.court ?? "");
                          const courtColor =
                            courtIdx >= 0
                              ? COURT_COLORS[courtIdx % COURT_COLORS.length]
                              : null;

                          return (
                            <div
                              key={pm.id}
                              className={`bg-white border rounded-2xl overflow-hidden transition-all ${pm.played ? "border-gray-100" : "border-gray-200"}`}
                            >
                              <div
                                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isClickable ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}`}
                                onClick={() =>
                                  isClickable && setPlayoffScoreModal(pm)
                                }
                              >
                                {/* Info */}
                                <div className="shrink-0 w-36 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-blue-500">
                                      {category}
                                    </span>
                                    {!pm.played && isClickable && (
                                      <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                                        A realizar
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-gray-500 truncate">
                                    {roundLabel}
                                  </span>
                                  {s?.court ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold truncate text-gray-600">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${courtColor?.dot ?? "bg-gray-300"}`}
                                      />
                                      {s.court}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-300 italic">
                                      Sem quadra
                                    </span>
                                  )}
                                  {s?.date ? (
                                    <span className="text-[10px] text-gray-400 tabular-nums">
                                      {formatDate(s.date)}
                                      {s.time ? ` · ${s.time}` : ""}
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
                                    {t1a}
                                  </p>
                                  {t1b && (
                                    <p
                                      className={`text-sm leading-tight truncate mt-0.5 ${win1 ? "font-semibold text-gray-900" : "text-gray-500"}`}
                                    >
                                      {t1b}
                                    </p>
                                  )}
                                </div>

                                {/* Placar */}
                                <div className="shrink-0 flex flex-col items-center min-w-[60px]">
                                  {pm.played ? (
                                    <span className="font-black text-sm tabular-nums text-gray-800">
                                      {pm.score1} × {pm.score2}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 font-black text-sm tabular-nums">
                                      — × —
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
                                    {t2a}
                                  </p>
                                  {t2b && (
                                    <p
                                      className={`text-sm leading-tight truncate mt-0.5 ${win2 ? "font-semibold text-gray-900" : "text-gray-500"}`}
                                    >
                                      {t2b}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          },
        )
      )}

      {/* ── Modal resultado — Grupos ──────────────────────────────────────── */}
      {scoreModal.open &&
        scoreModal.match &&
        (() => {
          const group = groups.find((g) => g.id === scoreModal.groupId);
          if (!group) return null;
          const t1 = getTeamName(group, scoreModal.match!.team1Id);
          const t2 = getTeamName(group, scoreModal.match!.team2Id);
          const existingSets = (scoreModal.match as any).sets as
            | Array<{ s1: number; s2: number }>
            | undefined;
          return (
            <ScoreModal
              team1Name={t1}
              team2Name={t2}
              initialScore1={scoreModal.match!.score1 ?? null}
              initialScore2={scoreModal.match!.score2 ?? null}
              initialSets={existingSets}
              onSave={async (payload) => {
                await saveScore(scoreModal.groupId, scoreModal.match!.id, {
                  score1: payload.score1,
                  score2: payload.score2,
                  sets: payload.sets,
                  ...(payload.wo ? { wo: payload.wo } : {}),
                });
              }}
              onClose={() =>
                setScoreModal({ open: false, groupId: "", match: null })
              }
            />
          );
        })()}
      {/* ── Modal resultado — Playoffs ─────────────────────────────────── */}
      {playoffScoreModal &&
        (() => {
          const t1 = playoffScoreModal.team1Label ?? "A definir";
          const t2 = playoffScoreModal.team2Label ?? "A definir";
          return (
            <ScoreModal
              team1Name={t1}
              team2Name={t2}
              initialScore1={playoffScoreModal.score1 ?? null}
              initialScore2={playoffScoreModal.score2 ?? null}
              onSave={async (payload) => {
                const winnerId =
                  payload.score1 > payload.score2
                    ? playoffScoreModal.team1Id!
                    : playoffScoreModal.team2Id!;
                await saveMatchResult(
                  playoffScoreModal.id,
                  payload.score1,
                  payload.score2,
                  winnerId,
                );
                setPlayoffScoreModal(null);
              }}
              onClose={() => setPlayoffScoreModal(null)}
            />
          );
        })()}
    </div>
  );
}

// ─── CARD DE GRUPO ────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: Group;
  category: string;
  colorIdx: number;
  locked: boolean;
  searchQuery: string;
  schedule: Record<string, { court?: string; date?: string; time?: string }>;
  onDragStart: (groupId: string, teamId: string) => void;
  onDrop: (groupId: string) => void;
  onOpenScore: (groupId: string, match: Match) => void;
  getTeamName: (teamId: string) => string;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm not-italic font-bold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function GroupCard({
  group,
  category,
  colorIdx,
  locked,
  searchQuery,
  onDragStart,
  onDrop,
  schedule,
  onOpenScore,
  getTeamName,
}: GroupCardProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!locked) setDragOver(true);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDrop(group.id);
  };

  const playedCount = group.matches.filter((m) => m.played).length;
  const totalMatches = group.matches.length;
  const groupLetter = group.name.replace("Grupo ", "");
  // Só destaca após todos os jogos terem resultado
  const allMatchesPlayed = totalMatches > 0 && playedCount === totalMatches;

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden transition-all border-2 shadow-sm hover:shadow-md ${
        dragOver && !locked
          ? "border-blue-400 shadow-blue-100 shadow-lg"
          : "border-gray-100"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="px-4 py-3.5 flex items-center justify-between"
        style={{ backgroundColor: "#1B2A4A" }}
      >
        <span className="text-base font-bold text-white">
          Grupo {groupLetter}
        </span>
        <span className="text-xs font-semibold text-white/90 bg-white/15 border border-white/25 px-2.5 py-1 rounded-full">
          {category}
        </span>
      </div>

      {/* ── Standings ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        {/* Cabeçalho colunas */}
        <div className="flex items-center pb-2 border-b border-gray-200 mb-0">
          <span className="w-7 shrink-0" />
          <span className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
            Dupla
          </span>
          <span className="w-8 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            V
          </span>
          <span className="w-12 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            S
          </span>
          <span className="w-10 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            G
          </span>
        </div>

        {group.teams.map((gt, i) => {
          const isQualified = allMatchesPlayed && gt.qualified;
          const isEliminated = allMatchesPlayed && !gt.qualified;
          return (
            <div
              key={gt.team.id}
              draggable={!locked}
              onDragStart={() => onDragStart(group.id, gt.team.id)}
              className={`flex items-center py-2.5 border-b border-dashed last:border-0 transition-colors ${
                isQualified
                  ? "border-emerald-100 bg-emerald-50 hover:bg-emerald-100"
                  : isEliminated
                    ? "border-red-100 bg-red-50 hover:bg-red-100"
                    : "border-gray-100 hover:bg-gray-50"
              } ${!locked && !allMatchesPlayed ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {/* Posição */}
              <div className="w-7 shrink-0">
                {isQualified ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                    {i + 1}
                  </span>
                ) : isEliminated ? (
                  <span className="w-5 h-5 rounded-full bg-red-400 text-white flex items-center justify-center text-[10px] font-black">
                    {i + 1}
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Nomes — ambos com mesmo peso visual */}
              <div className="flex-1 min-w-0 pl-1">
                <p
                  className={`text-sm leading-tight truncate ${isQualified ? "text-emerald-800" : isEliminated ? "text-red-700" : "text-gray-800"}`}
                >
                  <Highlight text={gt.team.player1Name} query={searchQuery} />
                </p>
                <p
                  className={`text-sm leading-tight mt-0.5 truncate ${isQualified ? "text-emerald-700" : isEliminated ? "text-red-600" : "text-gray-700"}`}
                >
                  <Highlight text={gt.team.player2Name} query={searchQuery} />
                </p>
              </div>

              {/* V */}
              <div className="w-8 text-center">
                <span
                  className={`text-sm font-semibold tabular-nums ${gt.wins > 0 ? "text-gray-800" : "text-gray-400"}`}
                >
                  {gt.wins}
                </span>
              </div>

              {/* S */}
              <div className="w-12 text-center">
                <span
                  className={`text-sm font-semibold tabular-nums ${gt.saldo > 0 ? "text-emerald-600" : gt.saldo < 0 ? "text-red-500" : "text-gray-400"}`}
                >
                  {gt.saldo > 0
                    ? `+${gt.saldo}`
                    : gt.saldo === 0
                      ? "0"
                      : gt.saldo}
                </span>
              </div>

              {/* G */}
              <div className="w-10 text-center">
                <span
                  className={`text-sm font-semibold tabular-nums ${gt.pointsFor > 0 ? "text-gray-800" : "text-gray-400"}`}
                >
                  {gt.pointsFor}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Partidas ─────────────────────────────────────────────────────── */}
      <div className="pb-4">
        {/* Label "Jogos" com fundo cinza */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-b border-gray-200 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Jogos
          </span>
          <span className="text-xs font-semibold text-gray-500 tabular-nums">
            {playedCount}/{totalMatches}
          </span>
        </div>

        <div className="px-3 space-y-1.5">
          {group.matches.map((match) => {
            // Pega ambos os nomes de cada dupla
            const fullName1 = getTeamName(match.team1Id); // "Fulano / Ciclano"
            const fullName2 = getTeamName(match.team2Id);
            const [p1a, p1b] = fullName1.split(" / ");
            const [p2a, p2b] = fullName2.split(" / ");
            const matchSetsArr = (match as any).sets as
              | Array<{ s1: number; s2: number }>
              | undefined;
            const _w1 =
              matchSetsArr && matchSetsArr.length > 0
                ? matchSetsArr.filter((s) => s.s1 > s.s2).length >
                  matchSetsArr.filter((s) => s.s2 > s.s1).length
                : match.score1 !== null &&
                  match.score2 !== null &&
                  match.score1 > match.score2;
            const _w2 =
              matchSetsArr && matchSetsArr.length > 0
                ? matchSetsArr.filter((s) => s.s2 > s.s1).length >
                  matchSetsArr.filter((s) => s.s1 > s.s2).length
                : match.score1 !== null &&
                  match.score2 !== null &&
                  match.score2 > match.score1;
            const win1 = match.played && _w1;
            const win2 = match.played && _w2;

            return (
              <button
                key={match.id}
                onClick={() => onOpenScore(group.id, match)}
                className={`w-full rounded-lg text-xs transition-colors border ${
                  match.played
                    ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    : "bg-white border-dashed border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  {/* Dupla 1 — dois nomes em linhas */}
                  <div
                    className={`flex-1 text-left ${win1 ? "opacity-100" : "opacity-60"}`}
                  >
                    <p
                      className={`leading-tight truncate ${win1 ? "text-gray-900 font-semibold" : "text-gray-600"}`}
                    >
                      {p1a}
                    </p>
                    {p1b && (
                      <p
                        className={`leading-tight truncate mt-0.5 ${win1 ? "text-gray-900 font-semibold" : "text-gray-500"}`}
                      >
                        {p1b}
                      </p>
                    )}
                  </div>

                  {/* Placar central */}
                  <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[60px]">
                    {match.played ? (
                      (() => {
                        const matchSets = (match as any).sets as
                          | Array<{ s1: number; s2: number }>
                          | undefined;
                        if (matchSets && matchSets.length > 0) {
                          // Cada set em uma linha: "9 × 7"
                          return matchSets.map((s, i) => (
                            <span
                              key={i}
                              className="font-black text-sm tabular-nums text-gray-800 leading-snug"
                            >
                              {s.s1} × {s.s2}
                            </span>
                          ));
                        }
                        // Sem sets registrados — usa score1/score2 direto
                        return (
                          <span className="font-black text-sm tabular-nums text-gray-800 leading-none">
                            {match.score1} × {match.score2}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="font-black text-sm tabular-nums text-gray-300">
                        — × —
                      </span>
                    )}
                    {match.played && match.wo && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 leading-none mt-0.5">
                        W.O.
                      </span>
                    )}
                  </div>

                  {/* Dupla 2 — dois nomes em linhas */}
                  <div
                    className={`flex-1 text-right ${win2 ? "opacity-100" : "opacity-60"}`}
                  >
                    <p
                      className={`leading-tight truncate ${win2 ? "text-gray-900 font-semibold" : "text-gray-600"}`}
                    >
                      {p2a}
                    </p>
                    {p2b && (
                      <p
                        className={`leading-tight truncate mt-0.5 ${win2 ? "text-gray-900 font-semibold" : "text-gray-500"}`}
                      >
                        {p2b}
                      </p>
                    )}
                  </div>
                </div>
                {/* Quadra / data / hora */}
                {(() => {
                  const s = schedule[match.id];
                  if (!s?.court && !s?.date) return null;
                  return (
                    <div className="flex items-center gap-2 px-3 pb-2 -mt-0.5">
                      {s.court && (
                        <span className="text-[10px] font-semibold text-blue-500 truncate">
                          {s.court}
                        </span>
                      )}
                      {s.court && s.date && (
                        <span className="text-[10px] text-gray-300">·</span>
                      )}
                      {s.date && (
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          {s.date.split("-").reverse().join("/")}
                          {s.time ? ` ${s.time}` : ""}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
