import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { PublicAthleteService, AuthService, type PublicAthlete } from "../services/api";
import SEOHead from "../components/SEOHead";
import { shareAthleteProfile } from "../utils/share";
import { RestrictedProfileCard } from "../components/RestrictedProfileCard";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const PublicAthleteProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [athlete, setAthlete] = useState<PublicAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const isOwnProfile = !!currentUser && currentUser.athleteId === id;

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
        <Link to="/tournaments" className="text-[#00ff88] hover:underline text-sm">
          ← Voltar para torneios
        </Link>
      </div>
    );
  }

  // Followers-only wall
  if (athlete.isFollowersOnly) {
    return (
      <RestrictedProfileCard
        fullName={athlete.fullName}
        nickname={athlete.nickname}
        avatarUrl={athlete.avatarUrl}
        variant="anonymous"
        onLogin={() => navigate("/login")}
      />
    );
  }

  const location = [athlete.city, athlete.state].filter(Boolean).join(", ");
  const memberSince = new Date(athlete.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const PUBLIC_DOMAIN = import.meta.env.VITE_PUBLIC_DOMAIN || "bubblepadel.com";
  const profileUrl = `https://${PUBLIC_DOMAIN}/athletes/${athlete.id}`;
  const ogImage = `https://${PUBLIC_DOMAIN}/og-athlete-default.png`;
  const seoTitle = `${athlete.fullName}${athlete.nickname ? ` (${athlete.nickname})` : ""} — Bubble Padel`;
  const seoDesc = `Perfil de ${athlete.fullName}, atleta de ${athlete.sports.map((s) => SPORT_LABELS[s] ?? s).join(", ")}${location ? `, ${location}` : ""}. Bubble Padel.`;

  const handleShare = async () => {
    const result = await shareAthleteProfile({ id: athlete.id, fullName: athlete.fullName });
    if (result.method === "clipboard") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        image={ogImage}
        url={profileUrl}
        type="profile"
      />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/[0.07]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            to="/tournaments"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Torneios
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#0a0e1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">Bubble</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copied ? "Link copiado!" : "Compartilhar"}
            </button>
            {isOwnProfile && (
              <Link
                to="/athlete/profile/edit"
                className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] rounded-lg text-sm font-semibold transition-colors"
              >
                Editar perfil
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-16 space-y-6">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center text-[#0a0e1a] text-2xl font-extrabold flex-shrink-0 shadow-[0_0_32px_rgba(0,232,122,0.15)] overflow-hidden">
            {athlete.avatarUrl
              ? <img src={athlete.avatarUrl} alt={athlete.fullName} className="w-full h-full object-cover" />
              : getInitials(athlete.fullName)}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-black tracking-tight mb-1">{athlete.fullName}</h1>
            {athlete.nickname && (
              <p className="text-[#00ccff] font-bold text-base mb-1">@{athlete.nickname}</p>
            )}
            {location && (
              <p className="text-gray-400 text-sm mb-3 flex items-center gap-1.5 justify-center sm:justify-start">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </p>
            )}
            {(athlete.instagramUrl || athlete.twitterUrl) && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                {athlete.instagramUrl && (
                  <a href={athlete.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-lg text-sm font-medium transition-colors">
                    Instagram
                  </a>
                )}
                {athlete.twitterUrl && (
                  <a href={athlete.twitterUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-lg text-sm font-medium transition-colors">
                    Twitter / X
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Bio ─────────────────────────────────────────────────────────── */}
        {athlete.bio && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
            <p className="text-gray-300 text-sm leading-relaxed">{athlete.bio}</p>
          </div>
        )}

        {/* ── Stats resumo ─────────────────────────────────────────────────── */}
        {athlete.stats && athlete.stats.totalMatches > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Desempenho</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Partidas", value: athlete.stats.totalMatches, color: "text-white" },
                { label: "Vitórias", value: athlete.stats.wins, color: "text-[#00e87a]" },
                {
                  label: "Win Rate",
                  value: athlete.stats.winRate != null ? `${athlete.stats.winRate}%` : "—",
                  color: (athlete.stats.winRate ?? 0) >= 50 ? "text-[#00e87a]" : "text-amber-400",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-[26px] font-black leading-none mb-1 ${color}`}>{value}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Sports & Rackets ─────────────────────────────────────────────── */}
        {(athlete.sports.length > 0 || athlete.rackets.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {athlete.sports.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Modalidades</h3>
                <div className="flex flex-wrap gap-2">
                  {athlete.sports.map((s) => (
                    <span key={s} className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-full text-sm font-semibold">
                      {SPORT_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {athlete.rackets.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Raquetes</h3>
                <div className="flex flex-wrap gap-2">
                  {athlete.rackets.map((r) => (
                    <span key={r} className="px-3 py-1 bg-[#00ccff]/10 text-[#00ccff] border border-[#00ccff]/20 rounded-full text-sm font-semibold">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Sala de Troféus ──────────────────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-[14px] font-extrabold tracking-tight">🏆 Sala de Troféus</h2>
          </div>
          {!athlete.trophies || athlete.trophies.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-3 opacity-30">🏆</p>
              <p className="text-gray-500 text-sm font-semibold">Nenhum troféu ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {athlete.trophies.map((t, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <span className="text-2xl flex-shrink-0">{t.position === 1 ? "🥇" : "🥈"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-white truncate">{t.tournamentName}</p>
                    <p className="text-[11px] text-gray-400 font-normal">{t.category} · {formatDate(t.date)}</p>
                  </div>
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    t.position === 1
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-gray-400/10 text-gray-400 border border-gray-400/20"
                  }`}>
                    {t.position === 1 ? "Campeão" : "Vice"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Patrocinadores (populado em 8.P3) ─────────────────────────────── */}
        {athlete.sponsors && athlete.sponsors.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Patrocinadores</h2>
            <div className="flex flex-wrap gap-3">
              {athlete.sponsors.map((sp) => (
                <a
                  key={sp.id}
                  href={sp.websiteUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl hover:bg-white/[0.09] transition-colors"
                >
                  {sp.logoUrl && <img src={sp.logoUrl} alt={sp.name} className="h-6 object-contain" />}
                  <span className="text-sm font-semibold text-gray-300">{sp.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-600 text-xs text-center pb-2">Membro desde {memberSince}</p>
      </main>
    </div>
  );
};

export default PublicAthleteProfile;
