import { useState, useEffect } from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface PaymentEntry {
  teamId: string;
  player1Name: string;
  player2Name: string;
  category: string;
  amount: number;
  player1Status: "PAID" | "PENDING" | "EXPIRED";
  player2Status: "PAID" | "PENDING" | "EXPIRED";
  registrationDate: string;
}

interface FinancialSummary {
  totalTeams: number;
  paidTeams: number;
  pendingTeams: number;
  grossRevenue: number;
  expectedRevenue: number;
  payments: PaymentEntry[];
}

interface TabFinanceiroProps {
  tournamentId: string;
  priceFirstCategory: number;
  pixKey: string;
  priceSecondCategory: number;
  onFieldChange: (field: any, value: any, label: string) => void;
  isSuper8?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function statusLabel(s: string) {
  if (s === "PAID") return { text: "Pago", cls: "bg-green-100 text-green-700" };
  if (s === "EXPIRED")
    return { text: "Expirado", cls: "bg-red-100 text-red-700" };
  return { text: "Pendente", cls: "bg-amber-100 text-amber-700" };
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function TabFinanceiro({
  tournamentId,
  priceFirstCategory,
  pixKey,
  priceSecondCategory,
  onFieldChange,
  isSuper8 = false,
}: TabFinanceiroProps) {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFinancial();
  }, [tournamentId]);

  const loadFinancial = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/financial`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Erro ao carregar dados financeiros");
      const json = await res.json();
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      [
        "Dupla",
        "Categoria",
        "Valor",
        "Jogador 1",
        "Pgto J1",
        "Jogador 2",
        "Pgto J2",
        "Data",
      ],
      ...data.payments.map((p) => [
        `${p.player1Name} / ${p.player2Name}`,
        p.category,
        `R$ ${p.amount.toFixed(2)}`,
        p.player1Name,
        p.player1Status === "PAID" ? "Pago" : "Pendente",
        p.player2Name,
        p.player2Status === "PAID" ? "Pago" : "Pendente",
        new Date(p.registrationDate).toLocaleDateString("pt-BR"),
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${tournamentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ── Configuração de preços ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Configurações Financeiras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Preço 1ª Categoria
            </label>
            <input
              type="number"
              value={priceFirstCategory}
              onChange={(e) =>
                onFieldChange(
                  "priceFirstCategory",
                  parseFloat(e.target.value),
                  "o preço da 1ª categoria",
                )
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
            />
          </div>
          {!isSuper8 && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Preço 2ª+ Categoria
            </label>
            <input
              type="number"
              value={priceSecondCategory || 0}
              onChange={(e) =>
                onFieldChange(
                  "priceSecondCategory",
                  parseFloat(e.target.value),
                  "o preço da 2ª+ categoria",
                )
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
            />
          </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Chave PIX
            </label>
            <input
              type="text"
              value={pixKey || ""}
              onChange={(e) =>
                onFieldChange("pixKey", e.target.value, "a chave PIX")
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
              placeholder="Clique para alterar"
            />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 italic flex items-center gap-2">
            <svg
              className="w-4 h-4 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Alterações financeiras exigem confirmação
          </p>
        </div>
      </div>

      {/* ── Dashboard de pagamentos ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Acompanhamento de Pagamentos
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={loadFinancial}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Atualizar"
            >
              <svg
                className="w-4 h-4 text-gray-500"
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
            </button>
            {data && data.payments.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                  Total duplas
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {data.totalTeams}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
                  Pagas
                </p>
                <p className="text-2xl font-black text-green-700">
                  {data.paidTeams}
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">
                  Pendentes
                </p>
                <p className="text-2xl font-black text-amber-700">
                  {data.pendingTeams}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                  Receita recebida
                </p>
                <p className="text-2xl font-black text-blue-700">
                  R$ {data.grossRevenue.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>

            {/* Receita esperada */}
            {data.expectedRevenue > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Receita esperada (100% pago)
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    R$ {data.expectedRevenue.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progresso</p>
                  <p className="text-lg font-bold text-blue-600">
                    {data.expectedRevenue > 0
                      ? Math.round(
                          (data.grossRevenue / data.expectedRevenue) * 100,
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${data.expectedRevenue > 0 ? Math.min(100, Math.round((data.grossRevenue / data.expectedRevenue) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Lista de pagamentos */}
            {data.payments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-medium">
                  Nenhuma inscrição com pagamento ainda
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Dupla
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Categoria
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Jogador 1
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Jogador 2
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Valor
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.payments.map((p) => {
                      const s1 = statusLabel(p.player1Status);
                      const s2 = statusLabel(p.player2Status);
                      return (
                        <tr
                          key={p.teamId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium text-gray-900">
                            {p.player1Name} / {p.player2Name}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {p.category}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s1.cls}`}
                            >
                              {s1.text}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s2.cls}`}
                            >
                              {s2.text}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-semibold text-gray-900">
                            R$ {p.amount.toFixed(2).replace(".", ",")}
                          </td>
                          <td className="py-3 px-2 text-gray-500">
                            {new Date(p.registrationDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
