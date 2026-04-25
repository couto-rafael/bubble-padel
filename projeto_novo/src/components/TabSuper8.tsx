import { useState, useEffect } from "react";

interface Super8Player {
  id: string;
  name: string;
  order: number;
  wins: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
}

interface Super8Match {
  id: string;
  round: number;
  matchIndex: number;
  team1p1: number;
  team1p2: number;
  team2p1: number;
  team2p2: number;
  score1: number | null;
  score2: number | null;
  played: boolean;
}

interface RegisteredAthlete {
  id: string;
  player1Name: string;
  status: string;
}

interface Props {
  tournamentId: string;
  registeredAthletes: RegisteredAthlete[];
  courts: string[];
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function authHeaders() {
  const token = localStorage.getItem("auth_token") ?? "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function RankingRow({ player, pos }: { player: Super8Player; pos: number }) {
  const saldo = player.gamesFor - player.gamesAgainst;
  return (
    <tr className="border-t border-gray-100">
      <td className="py-2.5 px-4 text-sm font-bold text-gray-500">{pos}</td>
      <td className="py-2.5 px-4 text-sm font-medium text-gray-900">{player.name}</td>
      <td className="py-2.5 px-4 text-sm text-center font-bold text-green-600">{player.wins}</td>
      <td className="py-2.5 px-4 text-sm text-center text-gray-500">{player.losses}</td>
      <td className="py-2.5 px-4 text-sm text-center text-gray-500">{player.gamesFor}</td>
      <td className="py-2.5 px-4 text-sm text-center text-gray-500">{player.gamesAgainst}</td>
      <td className={`py-2.5 px-4 text-sm text-center font-semibold ${saldo >= 0 ? "text-blue-600" : "text-red-500"}`}>
        {saldo >= 0 ? `+${saldo}` : saldo}
      </td>
    </tr>
  );
}

export default function TabSuper8({ tournamentId, registeredAthletes, courts }: Props) {
  const [players, setPlayers] = useState<Super8Player[]>([]);
  const [matches, setMatches] = useState<Super8Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { s1: string; s2: string }>>({});
  const [editingMatchIds, setEditingMatchIds] = useState<Set<string>>(new Set());
  const [openRounds, setOpenRounds] = useState<Set<number>>(new Set([1]));
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const confirmedAthletes = registeredAthletes.filter((a) => a.status === "confirmed");

  useEffect(() => {
    load();
  }, [tournamentId]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/super8/${tournamentId}`, { headers: authHeaders() });
      const j = await r.json();
      const { players: pl, matches: ma } = j.data ?? { players: [], matches: [] };
      setPlayers(pl);
      setMatches(ma);
      const init: Record<string, { s1: string; s2: string }> = {};
      for (const m of ma) {
        init[m.id] = {
          s1: m.score1 != null ? String(m.score1) : "",
          s2: m.score2 != null ? String(m.score2) : "",
        };
      }
      setScores(init);
    } catch {
      setMsg({ type: "err", text: "Erro ao carregar dados." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (confirmedAthletes.length !== 8) {
      setMsg({ type: "err", text: `São necessários exatamente 8 atletas confirmados. Atualmente: ${confirmedAthletes.length}.` });
      return;
    }
    setGenerating(true);
    setMsg(null);
    try {
      const playerNames = confirmedAthletes.map((a) => a.player1Name);
      const r = await fetch(`${API_URL}/super8/${tournamentId}/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ players: playerNames }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? "Erro ao gerar");
      }
      const j = await r.json();
      const { players: pl, matches: ma } = j.data;
      setPlayers(pl);
      setMatches(ma);
      const init: Record<string, { s1: string; s2: string }> = {};
      for (const m of ma) {
        init[m.id] = { s1: "", s2: "" };
      }
      setScores(init);
      setEditingMatchIds(new Set());
      setMsg({ type: "ok", text: "Partidas geradas!" });
    } catch (e: any) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveScore(match: Super8Match) {
    const sc = scores[match.id];
    if (!sc || sc.s1 === "" || sc.s2 === "") {
      setMsg({ type: "err", text: "Preencha os dois placares." });
      return;
    }
    const s1 = parseInt(sc.s1, 10);
    const s2 = parseInt(sc.s2, 10);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setMsg({ type: "err", text: "Placares devem ser números positivos." });
      return;
    }
    setSavingMatchId(match.id);
    setMsg(null);
    try {
      const r = await fetch(`${API_URL}/super8/${tournamentId}/matches/${match.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ score1: s1, score2: s2 }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? "Erro ao salvar");
      }
      const j = await r.json();
      setPlayers(j.data.players);
      setMatches(j.data.matches);
      // Sai do modo edição para este match
      setEditingMatchIds((prev) => {
        const next = new Set(prev);
        next.delete(match.id);
        return next;
      });
    } catch (e: any) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setSavingMatchId(null);
    }
  }

  function enterEdit(matchId: string) {
    setEditingMatchIds((prev) => new Set([...prev, matchId]));
  }

  const nameByOrder = new Map(players.map((p) => [p.order, p.name]));

  function toggleRound(round: number) {
    setOpenRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  }

  function courtForMatch(matchIndex: number): string {
    if (!courts || courts.length === 0) return "";
    return courts[matchIndex % courts.length];
  }

  const rounds: Record<number, Super8Match[]> = {};
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  const ranked = [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const saldoA = a.gamesFor - a.gamesAgainst;
    const saldoB = b.gamesFor - b.gamesAgainst;
    if (saldoB !== saldoA) return saldoB - saldoA;
    return b.gamesFor - a.gamesFor;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>;
  }

  // Ainda não gerou partidas
  if (matches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[13px] text-blue-700">
          <strong>Super 8</strong> — 8 jogadores, 7 rodadas, 14 partidas. Cada atleta joga ao lado de cada outro exatamente 1 vez.
        </div>

        {/* Lista de atletas confirmados */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Atletas inscritos confirmados ({confirmedAthletes.length}/8)
          </h3>
          {confirmedAthletes.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Nenhum atleta confirmado ainda. Confirme os atletas na aba Inscrições.</p>
          ) : (
            <div className="space-y-1.5">
              {confirmedAthletes.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{a.player1Name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {confirmedAthletes.length > 0 && confirmedAthletes.length !== 8 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700">
            ⚠️ Confirme exatamente 8 atletas na aba Inscrições para gerar as partidas. ({confirmedAthletes.length}/8)
          </div>
        )}

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || confirmedAthletes.length !== 8}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {generating ? "Gerando..." : "Gerar Partidas"}
        </button>
      </div>
    );
  }

  // Partidas geradas
  return (
    <div className="space-y-6">
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Partidas por rodada */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Partidas</h3>
        <div className="space-y-2">
          {Object.keys(rounds).map(Number).sort((a, b) => a - b).map((round) => {
            const roundMatches = rounds[round];
            const allPlayed = roundMatches.every((m) => m.played);
            const isOpen = openRounds.has(round);

            return (
              <div key={round} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleRound(round)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">Rodada {round}</span>
                    {allPlayed && (
                      <span className="text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Completa</span>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="divide-y divide-gray-100">
                    {roundMatches.map((match) => {
                      const sc = scores[match.id] ?? { s1: "", s2: "" };
                      const t1 = `${nameByOrder.get(match.team1p1) ?? "?"} + ${nameByOrder.get(match.team1p2) ?? "?"}`;
                      const t2 = `${nameByOrder.get(match.team2p1) ?? "?"} + ${nameByOrder.get(match.team2p2) ?? "?"}`;
                      const isSaving = savingMatchId === match.id;
                      const isEditing = editingMatchIds.has(match.id);
                      const isSaved = match.played && !isEditing;
                      const court = courtForMatch(match.matchIndex);

                      return (
                        <div key={match.id} className="px-4 py-4">
                          {court && (
                            <div className="text-[11px] font-semibold text-blue-600 mb-2">
                              🏟 {court}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isSaved && match.score1! > match.score2! ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>T1</span>
                                <span className="text-sm text-gray-800">{t1}</span>
                                {isSaved && <span className="text-sm font-bold text-gray-700 ml-auto">{match.score1}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isSaved && match.score2! > match.score1! ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>T2</span>
                                <span className="text-sm text-gray-800">{t2}</span>
                                {isSaved && <span className="text-sm font-bold text-gray-700 ml-auto">{match.score2}</span>}
                              </div>
                            </div>

                            {isSaved ? (
                              <button
                                onClick={() => enterEdit(match.id)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex-shrink-0"
                              >
                                Editar
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  value={sc.s1}
                                  onChange={(e) => setScores((prev) => ({ ...prev, [match.id]: { ...prev[match.id], s1: e.target.value } }))}
                                  className="w-14 text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 bg-white"
                                  placeholder="0"
                                />
                                <span className="text-gray-400 font-bold">×</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={sc.s2}
                                  onChange={(e) => setScores((prev) => ({ ...prev, [match.id]: { ...prev[match.id], s2: e.target.value } }))}
                                  className="w-14 text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 bg-white"
                                  placeholder="0"
                                />
                                <button
                                  onClick={() => handleSaveScore(match)}
                                  disabled={isSaving}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                  {isSaving ? "..." : "Salvar"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranking */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Ranking</h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2.5 px-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">#</th>
                <th className="py-2.5 px-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Jogador</th>
                <th className="py-2.5 px-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">V</th>
                <th className="py-2.5 px-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">D</th>
                <th className="py-2.5 px-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">GP</th>
                <th className="py-2.5 px-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">GC</th>
                <th className="py-2.5 px-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((player, i) => (
                <RankingRow key={player.id} player={player} pos={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">Critérios: Vitórias → Saldo games → Games a favor</p>
      </div>

      {/* Regerar */}
      <details className="border border-gray-200 rounded-xl">
        <summary className="px-4 py-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800">
          Regerar partidas (substitui tudo)
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-3">
          <p className="text-xs text-gray-500">
            Usa os atletas confirmados na aba Inscrições: {confirmedAthletes.map((a) => a.player1Name).join(", ") || "—"}
          </p>
          {confirmedAthletes.length !== 8 && (
            <p className="text-xs text-amber-600">⚠️ Confirme exatamente 8 atletas antes de regerar ({confirmedAthletes.length}/8).</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || confirmedAthletes.length !== 8}
            className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {generating ? "Gerando..." : "Regerar (apaga placar atual)"}
          </button>
        </div>
      </details>
    </div>
  );
}
