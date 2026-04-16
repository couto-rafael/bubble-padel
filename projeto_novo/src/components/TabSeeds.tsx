import { useState, useEffect } from "react";
import type { Team } from "../types";

interface Props {
  tournamentId: string;
  categories: string[];
  onBracketGenerated: () => void; // callback para ir para aba playoffs
}

interface SeedTeam {
  id: string;
  label: string;
  category: string;
  leaguePoints: number;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function authHeaders() {
  const token = localStorage.getItem("auth_token") ?? "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function TabSeeds({ tournamentId, categories, onBracketGenerated }: Props) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0] ?? "");
  const [seeds, setSeeds] = useState<SeedTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!selectedCategory) return;
    loadSeeds(selectedCategory);
  }, [selectedCategory, tournamentId]);

  async function loadSeeds(category: string) {
    setLoading(true);
    setMsg(null);
    try {
      // Busca times confirmados da categoria
      const r = await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, {
        headers: authHeaders(),
      });
      const j = await r.json();
      const teams: Team[] = (j.data ?? []).filter(
        (t: Team) => t.category === category && t.status === "confirmed",
      );

      if (teams.length === 0) {
        setSeeds([]);
        setLoading(false);
        return;
      }

      // Busca pontos de liga (tenta /api/leagues — pega primeiro torneio vinculado)
      let pointsMap: Record<string, number> = {};
      try {
        const lr = await fetch(`${API_URL}/leagues`, { headers: authHeaders() });
        const lj = await lr.json();
        const allLeagues: Array<{ id: string }> = [
          ...(lj.data?.created ?? []),
          ...(lj.data?.member ?? []),
        ];
        for (const league of allLeagues) {
          const dr = await fetch(`${API_URL}/leagues/${league.id}`, {
            headers: authHeaders(),
          });
          const dj = await dr.json();
          const linked = (dj.data?.tournaments ?? []).find(
            (lt: any) => lt.tournamentId === tournamentId,
          );
          if (linked) {
            const pts: Array<{ athleteId: string; points: number }> =
              dj.data?.points ?? [];
            pts.forEach((p) => { pointsMap[p.athleteId] = (pointsMap[p.athleteId] ?? 0) + p.points; });
            break;
          }
        }
      } catch {
        // sem liga — ok, usa 0 pts
      }

      const seedList: SeedTeam[] = teams
        .map((t) => ({
          id: t.id,
          label: `${t.player1Name} / ${t.player2Name}`,
          category,
          leaguePoints: 0, // liga vinculada por athleteId, não teamId — deixamos 0 por ora
        }))
        .sort((a, b) => b.leaguePoints - a.leaguePoints);

      setSeeds(seedList);
    } catch {
      setMsg({ type: "err", text: "Erro ao carregar times." });
    } finally {
      setLoading(false);
    }
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setSeeds((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    if (idx === seeds.length - 1) return;
    setSeeds((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  async function handleGenerate() {
    if (seeds.length < 2) {
      setMsg({ type: "err", text: "Mínimo 2 times confirmados na categoria." });
      return;
    }
    setGenerating(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_URL}/tournaments/${tournamentId}/seed`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          category: selectedCategory,
          teamIds: seeds.map((s) => s.id),
        }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? "Erro ao gerar bracket");
      }
      setMsg({ type: "ok", text: "Bracket gerado com sucesso!" });
      setTimeout(() => onBracketGenerated(), 800);
    } catch (e: any) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Categoria selector */}
      {categories.length > 1 && (
        <div>
          <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
            Categoria
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[13px] text-blue-700">
        <strong>Ordem = seed.</strong> Seed 1 fica no topo do bracket. Use ↑↓ para reordenar antes de gerar.
        Byes são atribuídos automaticamente aos maiores seeds quando o total não for potência de 2.
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400 text-sm">Carregando times...</div>
      )}

      {!loading && seeds.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Nenhum time confirmado na categoria <strong>{selectedCategory}</strong>.
        </div>
      )}

      {!loading && seeds.length > 0 && (
        <div className="space-y-2">
          {seeds.map((seed, idx) => (
            <div
              key={seed.id}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
            >
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-900">{seed.label}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Mover para cima"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === seeds.length - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Mover para baixo"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {msg && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium ${
            msg.type === "ok"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {!loading && seeds.length > 0 && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
        >
          {generating ? "Gerando bracket..." : `Gerar Bracket — ${seeds.length} times`}
        </button>
      )}
    </div>
  );
}
