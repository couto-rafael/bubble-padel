import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicAthleteService, type PublicAthlete } from "../services/api";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SPORT_LABELS: Record<string, string> = {
  PADEL: "Padel",
  BEACH_TENNIS: "Beach Tennis",
  TENIS: "Tênis",
  PICKLEBALL: "Pickleball",
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const PublicAthleteProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [athlete, setAthlete] = useState<PublicAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    PublicAthleteService.get(id)
      .then(setAthlete)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !athlete) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-white gap-4">
        <p className="text-xl font-bold">Atleta não encontrado</p>
        <Link
          to="/tournaments"
          className="text-[#00ff88] hover:underline text-sm"
        >
          ← Voltar para torneios
        </Link>
      </div>
    );
  }

  const location = [athlete.city, athlete.state].filter(Boolean).join(", ");
  const memberSince = new Date(athlete.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/[0.07]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            to="/tournaments"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
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
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#0a0e1a]"
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
            <span className="text-lg font-bold tracking-tight">Bubble</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-16">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center text-[#0a0e1a] text-2xl font-extrabold flex-shrink-0 shadow-[0_0_32px_rgba(0,232,122,0.15)]">
            {athlete.avatarUrl ? (
              <img
                src={athlete.avatarUrl}
                alt={athlete.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(athlete.fullName)
            )}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-black tracking-tight mb-1">
              {athlete.fullName}
            </h1>
            {athlete.nickname && (
              <p className="text-[#00ccff] font-bold text-base mb-1">
                @{athlete.nickname}
              </p>
            )}
            {location && (
              <p className="text-gray-400 text-sm mb-4 flex items-center gap-1.5 justify-center sm:justify-start">
                <svg
                  className="w-3.5 h-3.5"
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
              </p>
            )}
            {/* Social links */}
            {(athlete.instagramUrl || athlete.twitterUrl) && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                {athlete.instagramUrl && (
                  <a
                    href={athlete.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-lg text-sm font-medium transition-colors"
                  >
                    Instagram
                  </a>
                )}
                {athlete.twitterUrl && (
                  <a
                    href={athlete.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-lg text-sm font-medium transition-colors"
                  >
                    Twitter / X
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sports & Rackets ─────────────────────────────────────────────── */}
        {(athlete.sports.length > 0 || athlete.rackets.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {athlete.sports.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Modalidades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {athlete.sports.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-full text-sm font-semibold"
                    >
                      {SPORT_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {athlete.rackets.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Raquetes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {athlete.rackets.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1 bg-[#00ccff]/10 text-[#00ccff] border border-[#00ccff]/20 rounded-full text-sm font-semibold"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Member since ─────────────────────────────────────────────────── */}
        <p className="text-gray-600 text-sm text-center">
          Membro desde {memberSince}
        </p>
      </main>
    </div>
  );
};

export default PublicAthleteProfile;
