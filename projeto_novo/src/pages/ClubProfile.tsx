import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicClubService, type PublicClub } from "../services/api";

function normalizeStatus(s: string) {
  switch (s.toUpperCase()) {
    case "OPEN":
      return "Aberto";
    case "PUBLISHED":
      return "Em Breve";
    case "ONGOING":
      return "Em Andamento";
    case "COMPLETED":
      return "Finalizado";
    default:
      return s;
  }
}

function normalizeSport(s: string) {
  switch (s.toUpperCase()) {
    case "PADEL":
      return "Padel";
    case "BEACH_TENNIS":
      return "Beach Tennis";
    case "TENIS":
      return "Tênis";
    case "PICKLEBALL":
      return "Pickleball";
    default:
      return s;
  }
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${months[s.getMonth()]}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]}`;
}

const STATUS_COLORS: Record<string, string> = {
  Aberto: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Em Breve": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Em Andamento": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Finalizado: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClubProfile() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<PublicClub | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "open" | "ongoing" | "completed"
  >("all");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    PublicClubService.get(id)
      .then(setClub)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <header className="border-b border-white/[0.07] bg-[#0a0e1a]/95 sticky top-0 z-50 h-16" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 space-y-8 animate-pulse">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-white/5 rounded-xl w-64" />
              <div className="h-4 bg-white/5 rounded-lg w-40" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 h-52" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-2">Clube não encontrado</h2>
        <Link to="/tournaments" className="text-[#00ff88] hover:underline">
          Ver torneios
        </Link>
      </div>
    );
  }

  const location = [club.city, club.state].filter(Boolean).join(", ") || "—";
  const courtsCount = club.courts?.length ?? 0;
  const totalTournaments = club.tournaments.length;
  const completedTournaments = club.tournaments.filter(
    (t) => t.status.toUpperCase() === "COMPLETED",
  ).length;
  const activeTournaments = club.tournaments.filter((t) =>
    ["OPEN", "ONGOING", "PUBLISHED"].includes(t.status.toUpperCase()),
  ).length;

  const filteredTournaments = club.tournaments.filter((t) => {
    if (filter === "all") return true;
    if (filter === "open")
      return ["OPEN", "PUBLISHED"].includes(t.status.toUpperCase());
    if (filter === "ongoing") return t.status.toUpperCase() === "ONGOING";
    if (filter === "completed") return t.status.toUpperCase() === "COMPLETED";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.07] bg-[#0a0e1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/tournaments" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#0a0e27]"
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
            <span className="text-xl font-black tracking-tight">Bubble</span>
          </Link>
          <Link
            to="/tournaments"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Torneios
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0d1230] to-[#0a0e1a] pt-16 pb-12 px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.06),transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 flex-shrink-0 flex items-center justify-center">
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-[36px] md:text-[48px] font-black mb-3 tracking-tight leading-tight">
                {club.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-[13px]">
                <span className="flex items-center gap-1.5">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {location}
                </span>
                {club.phone && (
                  <a
                    href={`tel:${club.phone}`}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {club.phone}
                  </a>
                )}
                {courtsCount > 0 && (
                  <span className="flex items-center gap-1.5">
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
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                    {courtsCount} quadra{courtsCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-[32px] font-black text-[#00ff88] leading-none">
                  {totalTournaments}
                </div>
                <div className="text-xs text-gray-400 mt-1">Torneios</div>
              </div>
              <div className="text-center">
                <div className="text-[32px] font-black text-[#00ccff] leading-none">
                  {activeTournaments}
                </div>
                <div className="text-xs text-gray-400 mt-1">Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-[32px] font-black text-gray-300 leading-none">
                  {completedTournaments}
                </div>
                <div className="text-xs text-gray-400 mt-1">Concluídos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments */}
      <section className="py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-[20px] font-extrabold tracking-tight">
              Torneios do Clube
            </h2>
            <div className="flex gap-2 flex-wrap">
              {(["all", "open", "ongoing", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    filter === f
                      ? "bg-[#00ff88] text-[#0a0e27] border-[#00ff88]"
                      : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                  }`}
                >
                  {f === "all"
                    ? "Todos"
                    : f === "open"
                      ? "Abertos"
                      : f === "ongoing"
                        ? "Em Andamento"
                        : "Concluídos"}
                </button>
              ))}
            </div>
          </div>

          {filteredTournaments.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p>Nenhum torneio nesta categoria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => {
                const statusLabel = normalizeStatus(tournament.status);
                const statusClass =
                  STATUS_COLORS[statusLabel] ??
                  "bg-gray-500/20 text-gray-400 border-gray-500/30";
                const isOpen = tournament.status.toUpperCase() === "OPEN";
                return (
                  <Link
                    key={tournament.id}
                    to={`/tournaments/${tournament.id}`}
                    className="group bg-white/[0.04] p-5 rounded-2xl border border-white/[0.08] hover:border-[#00ff88]/30 hover:bg-white/[0.06] transition-all block"
                  >
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-[#00ccff]/10 text-[#00ccff] border-[#00ccff]/20">
                        {normalizeSport(tournament.sport)}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-extrabold mb-3 tracking-tight group-hover:text-[#00ff88] transition-colors">
                      {tournament.name}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-400 mb-5">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDateRange(
                          tournament.startDate,
                          tournament.endDate,
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {tournament._count.teams} duplas inscritas
                      </div>
                      {tournament.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tournament.categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 bg-white/[0.06] rounded-full text-[11px] text-gray-400"
                            >
                              {cat}
                            </span>
                          ))}
                          {tournament.categories.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/[0.06] rounded-full text-[11px] text-gray-400">
                              +{tournament.categories.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isOpen ? (
                      <div className="w-full py-2.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl font-extrabold text-[13px] text-center hover:bg-[#00ff99] transition-colors">
                        Inscrever-se
                      </div>
                    ) : (
                      <div className="w-full py-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-bold text-[13px] text-center">
                        {statusLabel === "Em Breve"
                          ? "Inscrições Em Breve"
                          : statusLabel === "Em Andamento"
                            ? "Em Andamento"
                            : "Ver Torneio"}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <Link to="/tournaments" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-[#0a0e27]"
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
            <span className="font-bold text-white">Bubble</span>
          </Link>
          <p>
            © {new Date().getFullYear()} Bubble. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
