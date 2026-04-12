import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";
import { AthleteViewService, type AthleteView, type AthleteViewEntry } from "../services/api";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(s: string) {
  switch (s?.toUpperCase()) {
    case "OPEN":
      return { label: "Inscrições abertas", cls: "bg-green-50 text-green-700" };
    case "PUBLISHED":
      return { label: "Em breve", cls: "bg-blue-50 text-blue-600" };
    case "CLOSED":
      return { label: "Aguardando início", cls: "bg-amber-50 text-amber-700" };
    case "ONGOING":
      return { label: "Em andamento", cls: "bg-purple-50 text-purple-700" };
    case "COMPLETED":
      return { label: "Concluído", cls: "bg-gray-100 text-gray-500" };
    default:
      return { label: s, cls: "bg-gray-100 text-gray-500" };
  }
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const AthleteProfileById: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState<AthleteView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    AthleteViewService.get(id)
      .then(setAthlete)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <AthleteHeader />
        <div className="flex items-center justify-center pt-32">
          <span className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin inline-block" />
        </div>
      </div>
    );
  }

  if (notFound || !athlete) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <AthleteHeader />
        <div className="flex flex-col items-center justify-center pt-32 gap-3 text-gray-500">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm">Atleta não encontrado.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 text-sm font-semibold hover:underline"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const location = [athlete.city, athlete.state].filter(Boolean).join(", ");
  const memberSince = new Date(athlete.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-12">

        {/* ── Voltar ──────────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-[13px] font-semibold mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        {/* ── Hero Card ───────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-5">
          <div className="h-16 bg-gradient-to-r from-[#00e87a]/10 via-[#00c8ff]/5 to-[#00e87a]/10" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-9 mb-4">
              <div className="w-16 h-16 rounded-2xl border-[3px] border-white bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(0,232,122,0.3)]">
                {athlete.avatarUrl ? (
                  <img
                    src={athlete.avatarUrl}
                    alt={athlete.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-extrabold text-[#0a0e1a]">
                    {getInitials(athlete.fullName)}
                  </span>
                )}
              </div>
              {/* Sem botão Editar Perfil — view-only */}
            </div>

            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-0.5">
              {athlete.fullName}
            </h1>
            {athlete.nickname && (
              <p className="text-[14px] font-semibold text-[#00e87a] mb-1.5">
                {athlete.nickname}
              </p>
            )}
            {location && (
              <p className="text-[12px] text-gray-500 mb-3 font-normal">
                📍 {location}
              </p>
            )}

            {/* Sports / Rackets / Social */}
            {((athlete.sports && athlete.sports.length > 0) ||
              (athlete.rackets && athlete.rackets.length > 0) ||
              athlete.instagramUrl ||
              athlete.twitterUrl) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {athlete.sports?.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#00e87a]/10 text-green-700 border border-[#00e87a]/20"
                  >
                    {s === "BEACH_TENNIS"
                      ? "🏖️ Beach Tennis"
                      : s === "PADEL"
                        ? "🎾 Padel"
                        : s === "TENIS"
                          ? "🎾 Tênis"
                          : "🏓 Pickleball"}
                  </span>
                ))}
                {athlete.rackets?.map(
                  (r) =>
                    r && (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        🏸 {r}
                      </span>
                    ),
                )}
                {athlete.instagramUrl && (
                  <a
                    href={`https://instagram.com/${athlete.instagramUrl.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 text-[11px] font-bold"
                  >
                    IG
                  </a>
                )}
                {athlete.twitterUrl && (
                  <a
                    href={`https://twitter.com/${athlete.twitterUrl.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 text-[11px] font-bold"
                  >
                    X
                  </a>
                )}
              </div>
            )}

            <p className="text-[11px] text-gray-400 font-normal">
              Membro desde {memberSince}
            </p>
          </div>
        </div>

        {/* ── Torneios ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight">
              Torneios
            </h2>
            <span className="text-[12px] text-gray-400 font-medium">
              {athlete.tournaments.length} inscrições
            </span>
          </div>

          {athlete.tournaments.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-12">
              <span className="text-4xl mb-3 block opacity-50">🎾</span>
              <p className="text-[14px] font-extrabold text-gray-800 mb-1.5">
                Nenhuma inscrição ainda
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {athlete.tournaments.map((entry: AthleteViewEntry) => {
                const badge = statusBadge(entry.tournament.status);
                const isP1 = entry.player1Name
                  .toLowerCase()
                  .includes(athlete.fullName.split(" ")[0].toLowerCase());
                const partner = isP1 ? entry.player2Name : entry.player1Name;
                return (
                  <Link
                    key={entry.id}
                    to={`/tournaments/${entry.tournament.id}`}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 group-hover:bg-gray-200 transition-colors">
                      {entry.tournament.sport?.toUpperCase() === "BEACH_TENNIS" ? "🏖️" : "🎾"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 text-[14px] truncate">
                          {entry.tournament.name}
                        </p>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 font-normal">
                        {entry.tournament.club.name} · {entry.tournament.club.city}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-medium">
                        <span>{entry.category}</span>
                        <span>{formatDate(entry.tournament.startDate)}</span>
                        {partner && (
                          <span className="hidden sm:inline">
                            🤝 {partner.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Bottom Nav — Mobile ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe z-50">
        <div className="flex">
          <Link
            to="/athlete/dashboard"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99] transition-colors"
          >
            <span className="text-xl leading-none">🏠</span>Início
          </Link>
          <Link
            to="/tournaments"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99] transition-colors"
          >
            <span className="text-xl leading-none">🎾</span>Torneios
          </Link>
          <Link
            to="/athlete/profile"
            state={{ tab: "trophies" }}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99] transition-colors"
          >
            <span className="text-xl leading-none">🏆</span>Troféus
          </Link>
          <Link
            to="/athlete/profile"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99] transition-colors"
          >
            <span className="text-xl leading-none">👤</span>Perfil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfileById;
