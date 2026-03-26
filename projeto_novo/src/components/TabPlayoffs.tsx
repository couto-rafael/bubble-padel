import { useState, useMemo, useEffect } from "react";
import ScoreModal from "../components/ScoreModal";
import type { Group, Team, Tournament } from "../types";
import { usePlayoffs, useGroups } from "../hooks";
import type { PlayoffBracketData, PlayoffMatchData } from "../services/api";

// ─── ALGORITMO DE SEEDING ─────────────────────────────────────────────────────

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

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

function buildSeeds(catGroups: Group[]): SeedEntry[] {
  const smallGroups = catGroups.filter((g) => g.teams.length <= 2);
  const normalGroups = catGroups.filter((g) => g.teams.length > 2);
  const seeds: SeedEntry[] = [];

  // 1° lugares dos grupos pequenos (todos juntos, viram top seeds)
  for (const g of smallGroups) {
    seeds.push({ teamId: null, label: `1° ${g.name}`, isBye: false });
  }
  // 2° lugares dos grupos pequenos (logo após os 1°)
  for (const g of smallGroups) {
    seeds.push({ teamId: null, label: `2° ${g.name}`, isBye: false });
  }
  for (const g of normalGroups) {
    seeds.push({ teamId: null, label: `1° ${g.name}`, isBye: false });
  }

  const seconds = normalGroups.map((g) => ({
    teamId: null,
    label: `2° ${g.name}`,
    isBye: false,
  }));
  seconds.reverse();
  for (let i = 0; i + 1 < seconds.length; i += 2) {
    [seconds[i], seconds[i + 1]] = [seconds[i + 1], seconds[i]];
  }
  seeds.push(...seconds);

  return seeds;
}

function generateBracketMatches(
  seeds: SeedEntry[],
): Omit<PlayoffMatchData, "id" | "bracketId">[] {
  const n = seeds.length;
  if (n < 2) return [];

  const totalSlots = nextPow2(n);
  const positions = bracketPositions(totalSlots);
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

  for (let i = 0; i < firstRoundSize; i++) {
    const s1 = seedMap[i * 2];
    const s2 = seedMap[i * 2 + 1];
    const isByeMatch = s1.isBye || s2.isBye;
    matches.push({
      roundSize: firstRoundSize,
      matchIndex: i,
      team1Id: null,
      team2Id: null,
      team1Label: s1.isBye ? null : s1.label,
      team2Label: s2.isBye ? null : s2.label,
      score1: null,
      score2: null,
      winnerId: null,
      isBye: isByeMatch,
      played: isByeMatch,
    });
  }

  for (let roundSize = firstRoundSize / 2; roundSize >= 1; roundSize /= 2) {
    for (let i = 0; i < roundSize; i++) {
      matches.push({
        roundSize,
        matchIndex: i,
        team1Id: null,
        team2Id: null,
        team1Label: null,
        team2Label: null,
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

function roundLabel(roundSize: number): string {
  if (roundSize === 1) return "Final";
  if (roundSize === 2) return "Semifinal";
  if (roundSize === 4) return "Quartas de Final";
  return "Oitavas de Final";
}

function teamDisplayName(
  teamId: string | null,
  teamLabel: string | null,
  teams: Team[],
  isByeSlot?: boolean,
): string {
  if (isByeSlot) return "BYE";
  if (teamId) {
    const t = teams.find((x) => x.id === teamId);
    if (t) return `${t.player1Name} / ${t.player2Name}`;
  }
  return teamLabel ?? "A definir";
}

// ─── MODAL DE RESULTADO ───────────────────────────────────────────────────────

interface MatchBoxProps {
  match: PlayoffMatchData;
  teams: Team[];
  onClick?: () => void;
  isClickable: boolean;
}

const MatchBox = ({ match, teams, onClick, isClickable }: MatchBoxProps) => {
  // Detecta qual slot é BYE para mostrar texto correto
  const t1IsBye =
    match.isBye && match.team1Label === null && match.team2Label !== null;
  const t2IsBye =
    match.isBye && match.team2Label === null && match.team1Label !== null;

  const t1 = teamDisplayName(match.team1Id, match.team1Label, teams, t1IsBye);
  const t2 = teamDisplayName(match.team2Id, match.team2Label, teams, t2IsBye);

  const t1Won =
    match.played && match.winnerId != null && match.winnerId === match.team1Id;
  const t2Won =
    match.played && match.winnerId != null && match.winnerId === match.team2Id;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={[
        "w-56 border-2 rounded-xl overflow-hidden shadow-sm transition-all select-none",
        isClickable
          ? "cursor-pointer hover:shadow-md hover:border-blue-400"
          : "cursor-default",
        match.isBye
          ? "opacity-50 bg-gray-50 border-gray-200"
          : "bg-white border-gray-200",
      ].join(" ")}
    >
      {/* Time 1 */}
      <div
        className={`flex items-center gap-1 px-3 py-2 border-b border-gray-100 ${t1Won ? "bg-emerald-50" : t2Won ? "bg-red-50/40" : "bg-white"}`}
      >
        <span
          className={`text-xs font-semibold truncate flex-1 ${t1IsBye ? "text-gray-400 italic" : t1Won ? "text-emerald-700" : t2Won ? "text-red-400" : "text-gray-700"}`}
          title={t1}
        >
          {t1}
        </span>
        {match.played && !match.isBye && (
          <span
            className={`text-sm font-black w-5 text-center flex-shrink-0 ${t1Won ? "text-emerald-700" : "text-gray-400"}`}
          >
            {match.score1 ?? "—"}
          </span>
        )}
      </div>

      {/* Time 2 */}
      <div
        className={`flex items-center gap-1 px-3 py-2 ${t2Won ? "bg-emerald-50" : t1Won ? "bg-red-50/40" : "bg-white"}`}
      >
        <span
          className={`text-xs font-semibold truncate flex-1 ${t2IsBye ? "text-gray-400 italic" : t2Won ? "text-emerald-700" : t1Won ? "text-red-400" : "text-gray-700"}`}
          title={t2}
        >
          {t2}
        </span>
        {match.played && !match.isBye && (
          <span
            className={`text-sm font-black w-5 text-center flex-shrink-0 ${t2Won ? "text-emerald-700" : "text-gray-400"}`}
          >
            {match.score2 ?? "—"}
          </span>
        )}
      </div>
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

  const cellHeightByRound: Record<number, number> = {};
  rounds.forEach((r, i) => {
    cellHeightByRound[r.size] = Math.pow(2, i) * 88;
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch gap-0 min-w-max">
        {rounds.map((round, roundIdx) => {
          const cellHeight = cellHeightByRound[round.size];
          const isLast = roundIdx === rounds.length - 1;
          return (
            <div key={round.size} className="flex items-stretch">
              <div className="flex flex-col">
                <div className="text-center mb-4 px-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {roundLabel(round.size)}
                  </span>
                </div>
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
                        className="flex items-center px-3"
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
              {!isLast && (
                <div
                  className="flex flex-col justify-around"
                  style={{ width: 20 }}
                >
                  {round.matches.map((_, i) =>
                    i % 2 === 0 ? (
                      <div
                        key={i}
                        className="flex flex-col"
                        style={{ height: cellHeight * 2 }}
                      >
                        <div
                          className="border-r-2 border-t-2 border-gray-200 rounded-tr-lg"
                          style={{ height: "50%", width: "100%" }}
                        />
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
  teams: Team[];
}

export default function TabPlayoffs({ tournament, teams }: TabPlayoffsProps) {
  const { brackets, loading, generateBracket, saveMatchResult, seedBracket } =
    usePlayoffs(tournament.id);

  // Carrega grupos diretamente do backend (igual a TabJogos) — evita estado stale do pai
  const { groups, loading: groupsLoading } = useGroups(tournament.id);

  // Categorias derivadas dos próprios grupos (evita mismatch de string com tournament.categories)
  const groupCategories = useMemo(
    () => [...new Set(groups.map((g) => g.category))].sort(),
    [groups],
  );

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [scoreModal, setScoreModal] = useState<PlayoffMatchData | null>(null);

  const catGroups = useMemo(
    () => groups.filter((g) => g.category === activeCategory),
    [groups, activeCategory],
  );

  const bracket = useMemo(
    () => brackets.find((b) => b.category === activeCategory) ?? null,
    [brackets, activeCategory],
  );

  const qualifiedCount = useMemo(
    () => catGroups.reduce((acc, g) => acc + Math.min(2, g.teams.length), 0),
    [catGroups],
  );

  // Efeito único: resolve categoria ativa e auto-gera bracket.
  // Reagir a groups.length garante que roda quando os grupos chegam via prop.
  useEffect(() => {
    if (groupCategories.length === 0) return;

    // Passo 1: garante categoria válida
    const resolved = groupCategories.includes(activeCategory)
      ? activeCategory
      : groupCategories[0];

    if (resolved !== activeCategory) {
      setActiveCategory(resolved);
      return; // vai re-renderizar com categoria correta
    }

    // Passo 2: aguarda playoffs carregar antes de gerar
    if (loading) return;

    // Passo 3: gera apenas se bracket não existe ainda
    if (brackets.find((b) => b.category === resolved)) return;

    const catG = groups.filter((g) => g.category === resolved);
    if (catG.length === 0) return;

    const seeds = buildSeeds(catG);
    const matches = generateBracketMatches(seeds);
    generateBracket(resolved, matches).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    groups.length,
    groupCategories.join(","),
    brackets.length,
    activeCategory,
  ]);

  // Seed automático: quando todos os jogos de um grupo estão encerrados,
  // resolve os labels "1° Grupo A" para nomes reais das duplas
  useEffect(() => {
    if (!activeCategory || loading || groupsLoading) return;
    const catGroups = groups.filter((g) => g.category === activeCategory);
    if (catGroups.length === 0) return;

    const anyGroupDone = catGroups.some(
      (g) => g.matches.length > 0 && g.matches.every((m) => m.played),
    );
    if (!anyGroupDone) return;

    const bracket = brackets.find((b) => b.category === activeCategory);
    if (!bracket) return;

    // Verifica se ainda há labels não resolvidos (teamId == null)
    const hasUnresolved = bracket.matches.some(
      (m) => !m.isBye && (!m.team1Id || !m.team2Id),
    );
    if (!hasUnresolved) return;

    seedBracket(activeCategory).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeCategory,
    loading,
    groupsLoading,
    brackets.length,
    groups.map((g) => g.matches.filter((m) => m.played).length).join(","),
  ]);

  const handleSaveScore = async (payload: {
    score1: number;
    score2: number;
    sets: Array<{ s1: number; s2: number }>;
    wo?: 1 | 2;
  }) => {
    if (!scoreModal) return;
    // Determina vencedor pelo placar do set 1
    const winnerId =
      payload.score1 > payload.score2 ? scoreModal.team1Id : scoreModal.team2Id;
    if (!winnerId) {
      alert("Dupla não identificada. Conclua a fase de grupos primeiro.");
      return;
    }
    await saveMatchResult(
      scoreModal.id,
      payload.score1,
      payload.score2,
      winnerId,
    );
    setScoreModal(null);
  };

  if (loading || groupsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs de categoria */}
      {groupCategories.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            {groupCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${activeCategory === cat ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
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

      {/* Sem grupos */}
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

      {/* Gerando bracket... */}
      {catGroups.length > 0 && !bracket && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Bracket gerado */}
      {bracket && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Chaveamento — {activeCategory}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {bracket.matches.filter((m) => m.played && !m.isBye).length} de{" "}
              {bracket.matches.filter((m) => !m.isBye).length} jogos realizados
              · {qualifiedCount} classificados · bracket de{" "}
              {nextPow2(qualifiedCount)}
            </p>
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
      {scoreModal &&
        (() => {
          const t1 = teamDisplayName(
            scoreModal.team1Id,
            scoreModal.team1Label,
            teams,
          );
          const t2 = teamDisplayName(
            scoreModal.team2Id,
            scoreModal.team2Label,
            teams,
          );
          return (
            <ScoreModal
              team1Name={t1}
              team2Name={t2}
              initialScore1={scoreModal.score1 ?? null}
              initialScore2={scoreModal.score2 ?? null}
              onSave={handleSaveScore}
              onClose={() => setScoreModal(null)}
            />
          );
        })()}
    </div>
  );
}
