import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthService } from "../services/api";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface CategoryResult {
  category: string;
  champion: { player1Name: string; player2Name: string } | null;
  vice: { player1Name: string; player2Name: string } | null;
  semiFinalists: { player1Name: string; player2Name: string }[];
}

interface PDFData {
  tournament: {
    name: string;
    sport: string;
    startDate: string;
    endDate: string;
    clubSede: string;
    club: { name: string; city: string };
  };
  results: CategoryResult[];
  generatedAt: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function normalizeSport(s: string) {
  switch (s?.toUpperCase()) {
    case "PADEL":
      return "Padel";
    case "BEACH_TENNIS":
      return "Beach Tennis";
    case "TENIS":
      return "Tênis";
    default:
      return s;
  }
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function TournamentResultsPDF() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PDFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const token = AuthService.getToken();
    fetch(`${API_URL}/tournaments/${id}/results`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>Erro ao carregar resultados.</p>
        <Link
          to={`/tournaments/${id}`}
          className="text-blue-500 underline text-sm"
        >
          Voltar ao torneio
        </Link>
      </div>
    );
  }

  const { tournament, results } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Barra de ação (não imprime) ─────────────────────────────────── */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            to={`/dashboard/tournaments/${id}/edit`}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Voltar
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-700">
            Resultados — {tournament.name}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[#050f1a] text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* ── Documento imprimível ────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-8 py-10 bg-white shadow-sm my-6 print:shadow-none print:my-0 print:px-12 print:py-10">
        {/* Cabeçalho */}
        <div className="text-center mb-10 pb-6 border-b-2 border-gray-900">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#050f1a] rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#00ff88]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-black text-gray-900">
              Bubble Padel
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {tournament.name}
          </h1>
          <p className="text-gray-500 text-sm">
            {normalizeSport(tournament.sport)} · {tournament.club.name}
            {tournament.club.city ? ` — ${tournament.club.city}` : ""}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {formatDate(tournament.startDate)}
            {tournament.endDate !== tournament.startDate &&
              ` a ${formatDate(tournament.endDate)}`}
          </p>
          {tournament.clubSede && (
            <p className="text-gray-400 text-sm mt-1">
              📍 {tournament.clubSede}
            </p>
          )}
        </div>

        {/* Resultados por categoria */}
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Playoffs ainda não foram jogados.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {results.map((cat) => (
              <div key={cat.category} className="print:break-inside-avoid">
                <h2 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b border-gray-200 uppercase tracking-wide">
                  {cat.category}
                </h2>

                <div className="space-y-3">
                  {/* Campeão */}
                  {cat.champion && (
                    <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="text-3xl">🏆</div>
                      <div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-0.5">
                          Campeões
                        </p>
                        <p className="text-base font-black text-gray-900">
                          {cat.champion.player1Name} /{" "}
                          {cat.champion.player2Name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Vice */}
                  {cat.vice && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="text-3xl">🥈</div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                          Vice-campeões
                        </p>
                        <p className="text-base font-bold text-gray-800">
                          {cat.vice.player1Name} / {cat.vice.player2Name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Semi-finalistas */}
                  {cat.semiFinalists.length > 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                        🥉 Semi-finalistas
                      </p>
                      <div className="space-y-1">
                        {cat.semiFinalists.map((t, i) => (
                          <p key={i} className="text-sm text-gray-700">
                            {t.player1Name} / {t.player2Name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>
            Documento gerado em{" "}
            {new Date(data.generatedAt).toLocaleString("pt-BR")} · Bubble Padel
            · bubblepadel.com.br
          </p>
        </div>
      </div>

      {/* CSS de impressão */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
