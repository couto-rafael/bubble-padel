import { useState, useMemo } from "react";
import type { Group, Team, Tournament } from "./types";
import { usePlayoffs } from "./hooks";
import type { PlayoffBracketData, PlayoffMatchData } from "./services/api";

// ─── ALGORITMO DE SEEDING ─────────────────────────────────────────────────────

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Gera a ordem de posições para um bracket padrão de tamanho `size`.
 * Resultado: array de índices de seed (1-based) na ordem das posições do bracket.
 * Ex: size=8 → [1,8,4,5,2,7,3,6]
 * Pares de oitavas: (1,8),(4,5),(2,7),(3,6) → 1 e 2 só se encontram na final
 */
function bracketPositions(size: number): number[] {
  if (size === 1) return [1];
  const prev = bracketPositions(size / 2);
  return prev.flatMap((s) => [s, size + 1 - s]);
}

interface SeedEntry {
  teamId: string | null;
  label: string;
  isBye: boolean;
}

/**
 * Gera os seeds ordenados a partir dos grupos de uma categoria.
 * Regras:
 * 1. Grupos com 2 duplas → seus 1° e 2° são os top seeds
 * 2. 1° lugares dos grupos normais (3+ duplas)
 * 3. 2° lugares em snake com swap de pares para evitar confronto precoce
 */
function buildSeeds(catGroups: Group[], teams: Team[]): SeedEntry[] {
  // Ordena as duplas dentro de cada grupo por standings
  const sorted = (g: Group): Team[] => {
    const members = g.teams as any[];
    return [...members]
      .sort((a, b) => {
        const ta: any =
          teams.find((t) => t.id === (a.id ?? a.teamId ?? a.team?.id)) ?? a;
        const tb: any =
          teams.find((t) => t.id === (b.id ?? b.teamId ?? b.team?.id)) ?? b;
        if ((tb.points ?? 0) !== (ta.points ?? 0))
          return (tb.points ?? 0) - (ta.points ?? 0);
        if ((tb.saldo ?? 0) !== (ta.saldo ?? 0))
          return (tb.saldo ?? 0) - (ta.saldo ?? 0);
        return (tb.wins ?? 0) - (ta.wins ?? 0);
      })
      .map((m: any) => {
        const id = m.id ?? m.teamId ?? m.team?.id;
        return teams.find((t) => t.id === id) ?? m;
      });
  };

  const getTeamId = (t: any): string | null => t?.id ?? t?.teamId ?? null;
  const getTeamLabel = (t: any, position: string, groupName: string): string =>
    `${position} ${groupName}`;

  const smallGroups = catGroups.filter((g) => g.teams.length <= 2);
  const normalGroups = catGroups.filter((g) => g.teams.length > 2);

  const seeds: SeedEntry[] = [];

  // Top seeds: grupos com 2 duplas
  for (const g of smallGroups) {
    const s = sorted(g);
    seeds.push({
      teamId: getTeamId(s[0]),
      label: getTeamLabel(s[0], "1°", g.name),
      isBye: false,
    });
    seeds.push({
      teamId: getTeamId(s[1]),
      label: getTeamLabel(s[1], "2°", g.name),
      isBye: false,
    });
  }

  // 1° lugares dos grupos normais
  for (const g of normalGroups) {
    const s = sorted(g);
    seeds.push({
      teamId: getTeamId(s[0]),
      label: getTeamLabel(s[0], "1°", g.name),
      isBye: false,
    });
  }

  // 2° lugares: reverso com swap de pares adjacentes
  const seconds = normalGroups.map((g) => {
    const s = sorted(g);
    return {
      teamId: getTeamId(s[1]),
      label: getTeamLabel(s[1], "2°", g.name),
      isBye: false,
    };
  });
  seconds.reverse();
  for (let i = 0; i + 1 < seconds.length; i += 2) {
    [seconds[i], seconds[i + 1]] = [seconds[i + 1], seconds[i]];
  }
  seeds.push(...seconds);

  return seeds;
}

/**
 * Gera os matches do bracket a partir dos seeds.
 */
function generateBracketMatches(
  seeds: SeedEntry[],
): Omit<PlayoffMatchData, "id" | "bracketId">[] {
  const n = seeds.length;
  if (n < 2) return [];

  const totalSlots = nextPow2(n);
  const positions = bracketPositions(totalSlots); // ex: [1,8,4,5,2,7,3,6] para size=8

  // Mapeia seed number → SeedEntry (com BYE para slots extras)
  const allSeeds: SeedEntry[] = [
    ...seeds,
    ...Array(totalSlots - n).fill({ teamId: null, label: "BYE", isBye: true }),
  ];
  const seedMap: Record<number, SeedEntry> = {};
  positions.forEach((seedNum, posIdx) => {
    seedMap[posIdx] = allSeeds[seedNum - 1];
  });

  const matches: Omit<PlayoffMatchData, "id" | "bracketId">[] = [];
  const firstRoundSize = totalSlots / 2;

  // Primeiro round: pares de posições adjacentes
  for (let i = 0; i < firstRoundSize; i++) {
    const s1 = seedMap[i * 2];
    const s2 = seedMap[i * 2 + 1];
    const isByeMatch = s1.isBye || s2.isBye;
    const winnerId = s1.isBye ? s2.teamId : s2.isBye ? s1.teamId : null;

    matches.push({
      roundSize: firstRoundSize,
      matchIndex: i,
      team1Id: s1.isBye ? null : s1.teamId,
      team2Id: s2.isBye ? null : s2.teamId,
      team1Label: s1.isBye ? null : s1.label,
      team2Label: s2.isBye ? null : s2.label,
      score1: null,
      score2: null,
      winnerId: isByeMatch ? winnerId : null,
      isBye: isByeMatch,
      played: isByeMatch,
    });
  }

  // Rounds subsequentes (a preencher com vencedores)
  for (let roundSize = firstRoundSize / 2; roundSize >= 1; roundSize /= 2) {
    for (let i = 0; i < roundSize; i++) {
      // Propaga vencedores de BYEs do round anterior
      const prevMatch1 = matches.find(
        (m) => m.roundSize === roundSize * 2 && m.matchIndex === i * 2,
      );
      const prevMatch2 = matches.find(
        (m) => m.roundSize === roundSize * 2 && m.matchIndex === i * 2 + 1,
      );

      const t1Id = prevMatch1?.isBye ? prevMatch1.winnerId : null;
      const t1Label = prevMatch1?.isBye
        ? prevMatch1.winnerId
          ? prevMatch1.team1Id === prevMatch1.winnerId
            ? prevMatch1.team1Label
            : prevMatch1.team2Label
          : null
        : null;

      const t2Id = prevMatch2?.isBye ? prevMatch2.winnerId : null;
      const t2Label = prevMatch2?.isBye
        ? prevMatch2.winnerId
          ? prevMatch2.team1Id === prevMatch2.winnerId
            ? prevMatch2.team1Label
            : prevMatch2.team2Label
          : null
        : null;

      matches.push({
        roundSize,
        matchIndex: i,
        team1Id: t1Id ?? null,
        team2Id: t2Id ?? null,
        team1Label: t1Id ? (t1Label ?? null) : null,
        team2Label: t2Id ? (t2Label ?? null) : null,
        score1: null,
        score2: null,
        winnerId: null,
        isBye: false,
        played: false,
      });
    }
  }

  return matches;
}

// ─── DISPLAY HELPERS ─────────────────────────────────────────────────────────

function roundLabel(roundSize: number, totalRounds: number): string {
  if (roundSize === 1) return "Final";
  if (roundSize === 2) return "Semifinal";
  if (roundSize === 4) return "Quartas de Final";
  return `Oitavas de Final`;
}

function teamDisplayName(
  teamId: string | null,
  teamLabel: string | null,
  teams: Team[],
): string {
  if (!teamId && !teamLabel) return "A definir";
  if (teamId) {
    const t = teams.find((x) => x.id === teamId);
    if (t) return `${t.player1Name} / ${t.player2Name}`;
  }
  return teamLabel ?? "A definir";
}

// ─── MODAL DE RESULTADO ───────────────────────────────────────────────────────

interface ScoreModalProps {
  match: PlayoffMatchData;
  teams: Team[];
  onSave: (score1: number, score2: number, winnerId: string) => Promise<void>;
  onClose: () => void;
}

const ScoreModal = ({ match, teams, onSave, onClose }: ScoreModalProps) => {
  const [s1, setS1] = useState(match.score1?.toString() ?? "");
  const [s2, setS2] = useState(match.score2?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const t1Name = teamDisplayName(match.team1Id, match.team1Label, teams);
  const t2Name = teamDisplayName(match.team2Id, match.team2Label, teams);

  const handleSave = async () => {
    const n1 = parseInt(s1);
    const n2 = parseInt(s2);
    if (isNaN(n1) || isNaN(n2) || n1 < 0 || n2 < 0) {
      alert("Insira placares válidos.");
      return;
    }
    if (n1 === n2) {
      alert("Não pode haver empate. Um dos times deve vencer.");
      return;
    }
    const winnerId = n1 > n2 ? match.team1Id : match.team2Id;
    if (!winnerId) {
      alert("Dupla não identificada. Verifique se as equipes estão definidas.");
      return;
    }
    setSaving(true);
    try {
      await onSave(n1, n2, winnerId);
      onClose();
    } catch {
      alert("Erro ao salvar resultado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Registrar Resultado
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500 mb-1 font-medium truncate">
                {t1Name}
              </p>
              <input
                type="number"
                min={0}
                value={s1}
                onChange={(e) => setS1(e.target.value)}
                className="w-full text-center text-3xl font-black py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="text-2xl font-black text-gray-400">×</div>
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500 mb-1 font-medium truncate">
                {t2Name}
              </p>
              <input
                type="number"
                min={0}
                value={s2}
                onChange={(e) => setS2(e.target.value)}
                className="w-full text-center text-3xl font-black py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                placeholder="0"
              />
            </div>
          </div>

          {s1 !== "" && s2 !== "" && parseInt(s1) !== parseInt(s2) && (
            <div className="text-center text-sm text-emerald-700 bg-emerald-50 rounded-lg py-2 font-semibold">
              Vencedor: {parseInt(s1) > parseInt(s2) ? t1Name : t2Name}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MATCH BOX ────────────────────────────────────────────────────────────────

interface MatchBoxProps {
  match: PlayoffMatchData;
  teams: Team[];
  onClick?: () => void;
  isClickable: boolean;
}

const MatchBox = ({ match, teams, onClick, isClickable }: MatchBoxProps) => {
  const t1 = teamDisplayName(match.team1Id, match.team1Label, teams);
  const t2 = teamDisplayName(match.team2Id, match.team2Label, teams);

  const t1Won = match.played && match.winnerId === match.team1Id;
  const t2Won = match.played && match.winnerId === match.team2Id;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        w-52 border-2 rounded-xl overflow-hidden shadow-sm transition-all select-none
        ${isClickable ? "cursor-pointer hover:shadow-md hover:border-blue-400" : "cursor-default"}
        ${match.isBye ? "opacity-50" : "bg-white border-gray-200"}
      `}
    >
      {/* Time 1 */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 border-b border-gray-100
          ${t1Won ? "bg-emerald-50" : t2Won ? "bg-red-50" : "bg-white"}
        `}
      >
        <span
          className={`text-xs font-semibold truncate flex-1 mr-2 ${
            t1Won
              ? "text-emerald-700"
              : t2Won
                ? "text-red-400"
                : "text-gray-700"
          }`}
          title={t1}
        >
          {match.isBye && !match.team1Id ? "—" : t1}
        </span>
        <span
          className={`text-sm font-black w-6 text-center ${
            t1Won
              ? "text-emerald-700"
              : t2Won
                ? "text-red-400"
                : "text-gray-400"
          }`}
        >
          {match.played ? (match.score1 ?? "—") : ""}
        </span>
        {t1Won && (
          <span className="ml-1 text-emerald-500">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>

      {/* Time 2 */}
      <div
        className={`
          flex items-center justify-between px-3 py-2
          ${t2Won ? "bg-emerald-50" : t1Won ? "bg-red-50" : "bg-white"}
        `}
      >
        <span
          className={`text-xs font-semibold truncate flex-1 mr-2 ${
            t2Won
              ? "text-emerald-700"
              : t1Won
                ? "text-red-400"
                : "text-gray-700"
          }`}
          title={t2}
        >
          {match.isBye && !match.team2Id ? "—" : t2}
        </span>
        <span
          className={`text-sm font-black w-6 text-center ${
            t2Won
              ? "text-emerald-700"
              : t1Won
                ? "text-red-400"
                : "text-gray-400"
          }`}
        >
          {match.played ? (match.score2 ?? "—") : ""}
        </span>
        {t2Won && (
          <span className="ml-1 text-emerald-500">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>

      {/* Status label */}
      {isClickable && !match.played && (
        <div className="bg-blue-50 text-center text-xs text-blue-600 font-semibold py-1 border-t border-blue-100">
          Clique para registrar
        </div>
      )}
      {match.isBye && (
        <div className="bg-gray-50 text-center text-xs text-gray-400 font-medium py-1 border-t border-gray-100">
          BYE
        </div>
      )}
    </div>
  );
};

// ─── BRACKET VIEW ─────────────────────────────────────────────────────────────

interface BracketViewProps {
  bracket: PlayoffBracketData;
  teams: Team[];
  onMatchClick: (match: PlayoffMatchData) => void;
}

const BracketView = ({ bracket, teams, onMatchClick }: BracketViewProps) => {
  // Agrupa matches por roundSize, ordenado do maior (oitavas) ao menor (final)
  const rounds = useMemo(() => {
    const roundMap: Record<number, PlayoffMatchData[]> = {};
    for (const m of bracket.matches) {
      if (!roundMap[m.roundSize]) roundMap[m.roundSize] = [];
      roundMap[m.roundSize].push(m);
    }
    return Object.entries(roundMap)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([size, matches]) => ({
        size: parseInt(size),
        matches: [...matches].sort((a, b) => a.matchIndex - b.matchIndex),
      }));
  }, [bracket.matches]);

  const totalRounds = rounds.length;

  // Altura de cada célula por round (maior no primeiro round, reduz progressivamente)
  const cellHeightByRound: Record<number, number> = {};
  rounds.forEach((r, i) => {
    cellHeightByRound[r.size] = Math.pow(2, i) * 80;
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch gap-0 min-w-max">
        {rounds.map((round, roundIdx) => {
          const cellHeight = cellHeightByRound[round.size];
          const isLast = roundIdx === rounds.length - 1;

          return (
            <div key={round.size} className="flex items-stretch">
              {/* Coluna do round */}
              <div className="flex flex-col">
                {/* Header do round */}
                <div className="text-center mb-3 px-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {roundLabel(round.size, totalRounds)}
                  </span>
                </div>

                {/* Matches */}
                <div className="flex flex-col justify-around flex-1">
                  {round.matches.map((match) => {
                    const isClickable =
                      !match.isBye &&
                      !match.played &&
                      match.team1Id != null &&
                      match.team2Id != null;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center"
                        style={{ height: cellHeight }}
                      >
                        <MatchBox
                          match={match}
                          teams={teams}
                          onClick={() => onMatchClick(match)}
                          isClickable={isClickable}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conector entre rounds */}
              {!isLast && (
                <div
                  className="flex flex-col justify-around"
                  style={{ width: 24 }}
                >
                  {round.matches.map((_, i) =>
                    i % 2 === 0 ? (
                      <div
                        key={i}
                        className="flex flex-col"
                        style={{ height: cellHeight * 2 }}
                      >
                        {/* Linha superior */}
                        <div
                          className="border-r-2 border-t-2 border-gray-200 rounded-tr-lg"
                          style={{ height: "50%", width: "100%" }}
                        />
                        {/* Linha inferior */}
                        <div
                          className="border-r-2 border-b-2 border-gray-200 rounded-br-lg"
                          style={{ height: "50%", width: "100%" }}
                        />
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

interface TabPlayoffsProps {
  tournament: Tournament;
  groups: Group[];
  teams: Team[];
}

export default function TabPlayoffs({
  tournament,
  groups,
  teams,
}: TabPlayoffsProps) {
  const { brackets, loading, generateBracket, saveMatchResult, resetBracket } =
    usePlayoffs(tournament.id);

  const [activeCategory, setActiveCategory] = useState<string>(
    tournament.categories[0] ?? "",
  );
  const [scoreModal, setScoreModal] = useState<PlayoffMatchData | null>(null);
  const [generating, setGenerating] = useState(false);

  const catGroups = useMemo(
    () => groups.filter((g) => g.category === activeCategory),
    [groups, activeCategory],
  );

  const bracket = useMemo(
    () => brackets.find((b) => b.category === activeCategory) ?? null,
    [brackets, activeCategory],
  );

  const canGenerate = useMemo(() => {
    if (catGroups.length === 0) return false;
    // Só gera se todos os jogos dos grupos tiverem resultado
    const allPlayed = catGroups.every((g) =>
      g.matches.every((m: any) => m.played),
    );
    return allPlayed;
  }, [catGroups]);

  const qualifiedCount = useMemo(() => {
    return catGroups.reduce((acc, g) => acc + Math.min(2, g.teams.length), 0);
  }, [catGroups]);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const seeds = buildSeeds(catGroups, teams);
      const matches = generateBracketMatches(seeds);
      await generateBracket(activeCategory, matches);
    } catch {
      alert("Erro ao gerar chaveamento.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        `Deseja resetar o chaveamento de "${activeCategory}"? Os resultados serão perdidos.`,
      )
    )
      return;
    await resetBracket(activeCategory);
  };

  const handleSaveScore = async (
    score1: number,
    score2: number,
    winnerId: string,
  ) => {
    if (!scoreModal) return;
    await saveMatchResult(scoreModal.id, score1, score2, winnerId);
    setScoreModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs de categoria */}
      {tournament.categories.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            {tournament.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                  activeCategory === cat
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado: sem grupos */}
      {catGroups.length === 0 && (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-semibold mb-1">
            Nenhum grupo em "{activeCategory}"
          </p>
          <p className="text-gray-400 text-sm">
            Gere os grupos na aba Grupos primeiro.
          </p>
        </div>
      )}

      {/* Estado: grupos sem todos os jogos */}
      {catGroups.length > 0 && !bracket && !canGenerate && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-amber-800 font-semibold mb-1">
            Fase de grupos em andamento
          </p>
          <p className="text-amber-700 text-sm">
            Complete todos os jogos da fase de grupos de "{activeCategory}" para
            gerar o chaveamento.
          </p>
          <p className="text-amber-600 text-xs mt-2 font-medium">
            {qualifiedCount} classificado{qualifiedCount !== 1 ? "s" : ""}{" "}
            definido{qualifiedCount !== 1 ? "s" : ""} até agora
          </p>
        </div>
      )}

      {/* Estado: pronto para gerar */}
      {catGroups.length > 0 && !bracket && canGenerate && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Fase de grupos concluída!
          </h3>
          <p className="text-gray-500 text-sm mb-1">
            {qualifiedCount} dupla{qualifiedCount !== 1 ? "s" : ""} classificada
            {qualifiedCount !== 1 ? "s" : ""} em {catGroups.length} grupo
            {catGroups.length !== 1 ? "s" : ""}
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Bracket de {nextPow2(qualifiedCount)} posições ·{" "}
            {nextPow2(qualifiedCount) - qualifiedCount} BYE
            {nextPow2(qualifiedCount) - qualifiedCount !== 1 ? "s" : ""}
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm"
          >
            {generating ? "Gerando..." : "Gerar Chaveamento Automático"}
          </button>
        </div>
      )}

      {/* Bracket gerado */}
      {bracket && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Chaveamento — {activeCategory}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {bracket.matches.filter((m) => m.played && !m.isBye).length} de{" "}
                {bracket.matches.filter((m) => !m.isBye).length} jogos
                realizados
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refazer Chaveamento
            </button>
          </div>

          <BracketView
            bracket={bracket}
            teams={teams}
            onMatchClick={(match) => {
              if (
                !match.isBye &&
                !match.played &&
                match.team1Id &&
                match.team2Id
              ) {
                setScoreModal(match);
              }
            }}
          />

          {/* Campeão */}
          {(() => {
            const finalMatch = bracket.matches.find((m) => m.roundSize === 1);
            if (!finalMatch?.played || !finalMatch.winnerId) return null;
            const champion = teamDisplayName(
              finalMatch.winnerId,
              finalMatch.team1Id === finalMatch.winnerId
                ? finalMatch.team1Label
                : finalMatch.team2Label,
              teams,
            );
            return (
              <div className="mt-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
                  Campeão — {activeCategory}
                </p>
                <p className="text-amber-900 text-xl font-black">{champion}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal de resultado */}
      {scoreModal && (
        <ScoreModal
          match={scoreModal}
          teams={teams}
          onSave={handleSaveScore}
          onClose={() => setScoreModal(null)}
        />
      )}
    </div>
  );
}
