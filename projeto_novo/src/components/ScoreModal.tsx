import { useState } from "react";
import type { Set } from "../types";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ScoreModalProps {
  team1Name: string; // "João Silva / Pedro Costa"
  team2Name: string;
  initialScore1?: number | null;
  initialScore2?: number | null;
  initialSets?: Array<{ s1: number; s2: number }>;
  onSave: (payload: {
    score1: number;
    score2: number;
    sets: Array<{ s1: number; s2: number }>;
    wo?: 1 | 2;
  }) => Promise<void>;
  onClose: () => void;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function ScoreModal({
  team1Name,
  team2Name,
  initialScore1,
  initialScore2,
  initialSets,
  onSave,
  onClose,
}: ScoreModalProps) {
  const [t1a, t1b] = team1Name.split(" / ");
  const [t2a, t2b] = team2Name.split(" / ");

  const [scoreInput, setScoreInput] = useState({
    score1: initialScore1 != null ? String(initialScore1) : "",
    score2: initialScore2 != null ? String(initialScore2) : "",
  });
  const [sets, setSets] = useState<Array<{ s1: string; s2: string }>>(
    initialSets && initialSets.length > 1
      ? initialSets.slice(1).map((s) => ({ s1: String(s.s1), s2: String(s.s2) }))
      : [],
  );
  const [showSets, setShowSets] = useState(
    initialSets != null && initialSets.length > 1,
  );
  const [showWO, setShowWO] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const s1 = parseInt(scoreInput.score1),
      s2 = parseInt(scoreInput.score2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      alert("Insira resultados válidos no 1º set.");
      return;
    }
    if (s1 === s2) {
      alert("Não pode haver empate no 1º set.");
      return;
    }

    const parsedSets: Array<{ s1: number; s2: number }> = [{ s1, s2 }];
    for (let i = 0; i < sets.length; i++) {
      const ps1 = parseInt(sets[i].s1), ps2 = parseInt(sets[i].s2);
      if (isNaN(ps1) || isNaN(ps2) || ps1 < 0 || ps2 < 0) {
        alert(`Insira resultados válidos no ${i + 2}º set.`);
        return;
      }
      if (ps1 === ps2) {
        alert(`Não pode haver empate no ${i + 2}º set.`);
        return;
      }
      parsedSets.push({ s1: ps1, s2: ps2 });
    }

    let wins1 = 0, wins2 = 0;
    for (const ps of parsedSets) {
      if (ps.s1 > ps.s2) wins1++;
      else wins2++;
    }
    if (wins1 === wins2) {
      alert("Resultado final em sets empatado. Adicione um set desempate.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ score1: parsedSets[0].s1, score2: parsedSets[0].s2, sets: parsedSets });
      onClose();
    } catch {
      alert("Erro ao salvar resultado. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleWO = async (winner: 1 | 2) => {
    setSaving(true);
    try {
      await onSave({ score1: winner === 1 ? 9 : 0, score2: winner === 2 ? 9 : 0, wo: winner, sets: [] });
      onClose();
    } catch {
      alert("Erro ao registrar W.O.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Registrar Resultado
        </h3>
        <p className="text-sm text-gray-500 mb-5">Insira o placar do jogo</p>

        {/* Nomes das duplas */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-700 truncate leading-tight">{t1a}</p>
            {t1b && (
              <p className="text-sm text-gray-700 truncate leading-tight mt-0.5">{t1b}</p>
            )}
          </div>
          <span className="w-6 shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-700 truncate leading-tight">{t2a}</p>
            {t2b && (
              <p className="text-sm text-gray-700 truncate leading-tight mt-0.5">{t2b}</p>
            )}
          </div>
        </div>

        {/* Sets */}
        <div className="space-y-2 mb-3">
          {/* Set 1 */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 pl-1">
              Set 1
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                value={scoreInput.score1}
                onChange={(e) =>
                  setScoreInput((s) => ({ ...s, score1: e.target.value }))
                }
                className="w-0 flex-1 text-center text-3xl font-black py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
                placeholder="0"
              />
              <span className="text-xl font-bold text-gray-300 shrink-0">×</span>
              <input
                type="number"
                min={0}
                value={scoreInput.score2}
                onChange={(e) =>
                  setScoreInput((s) => ({ ...s, score2: e.target.value }))
                }
                className="w-0 flex-1 text-center text-3xl font-black py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
                placeholder="0"
              />
            </div>
          </div>

          {/* Sets adicionais */}
          {showSets &&
            sets.map((set, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1 pl-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Set {idx + 2}
                  </p>
                  <button
                    onClick={() => {
                      setSets((prev) => prev.filter((_, i) => i !== idx));
                      if (sets.length === 1) setShowSets(false);
                    }}
                    className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={set.s1}
                    onChange={(e) =>
                      setSets((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, s1: e.target.value } : s))
                      )
                    }
                    className="w-0 flex-1 text-center text-3xl font-black py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
                    placeholder="0"
                  />
                  <span className="text-xl font-bold text-gray-300 shrink-0">×</span>
                  <input
                    type="number"
                    min={0}
                    value={set.s2}
                    onChange={(e) =>
                      setSets((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, s2: e.target.value } : s))
                      )
                    }
                    className="w-0 flex-1 text-center text-3xl font-black py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
        </div>

        {/* Ações secundárias */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => {
              setShowWO((v) => !v);
              setShowSets(false);
              setSets([]);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Vitória por W.O.
          </button>
          <span className="text-gray-200">|</span>
          <button
            type="button"
            onClick={() => {
              setShowSets(true);
              setShowWO(false);
              setSets((prev) => [...prev, { s1: "", s2: "" }]);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Set
          </button>
        </div>

        {/* WO expandido */}
        {showWO && (
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-amber-700 mb-2 text-center">
              Quem venceu por W.O.?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleWO(1)}
                className="flex-1 py-2 px-2 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors text-center leading-tight"
              >
                <span className="block truncate">{t1a}</span>
                {t1b && <span className="block truncate text-amber-600 font-normal">{t1b}</span>}
              </button>
              <button
                onClick={() => handleWO(2)}
                className="flex-1 py-2 px-2 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors text-center leading-tight"
              >
                <span className="block truncate">{t2a}</span>
                {t2b && <span className="block truncate text-amber-600 font-normal">{t2b}</span>}
              </button>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
