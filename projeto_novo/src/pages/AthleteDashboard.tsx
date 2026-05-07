import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AthleteProfile {
  id: string;
  fullName: string;
  phone?: string | null;
  city?: string;
  state?: string;
  avatarUrl?: string | null;
  sports?: string[];
  createdAt: string;
  user?: { email: string };
}

interface TournamentEntry {
  id: string;
  player1Name: string;
  player2Name: string;
  category: string;
  status: string;
  amount: number;
  registrationDate: string;
  tournament: {
    id: string;
    name: string;
    sport: string;
    status: string;
    startDate: string;
    endDate: string;
    club: { id: string; name: string; city: string };
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
});

async function fetchProfile(): Promise<AthleteProfile> {
  const res = await fetch(`${API_URL}/athlete/profile`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data;
}

async function fetchTournaments(): Promise<TournamentEntry[]> {
  const res = await fetch(`${API_URL}/athlete/tournaments`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data ?? [];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

function statusBadge(tournamentStatus: string) {
  switch (tournamentStatus?.toUpperCase()) {
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
      return { label: tournamentStatus, cls: "bg-gray-100 text-gray-500" };
  }
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "AT"
  );
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const AthleteDashboard: React.FC = () => {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [entries, setEntries] = useState<TournamentEntry[]>([]);
  const [stats, setStats] = useState<{
    wins: number;
    losses: number;
    winRate: number;
    totalMatches: number;
    topPartner: { name: string; winRate: number } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const pathLocation = useLocation();

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
    const token = localStorage.getItem("auth_token") ?? "";
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetchProfile(),
      fetchTournaments(),
      fetch(`${API_URL}/athlete/stats`, { headers })
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([p, t, s]) => {
        setProfile(p);
        setBannerDismissed(localStorage.getItem(`bubble_profile_banner_${p?.id}`) === "1");
        setEntries(t);
        if (s?.data?.summary) {
          const enriched = s.data.enrichedStats;
          const bp = enriched?.bestPartners?.[0] ?? null;
          setStats({
            wins: s.data.summary.wins ?? 0,
            losses: s.data.summary.losses ?? 0,
            winRate: s.data.summary.winRate ?? 0,
            totalMatches: enriched?.totalMatches ?? (s.data.summary.wins ?? 0) + (s.data.summary.losses ?? 0),
            topPartner: bp ? { name: bp.name, winRate: bp.winRate } : null,
          });
        }
      })
      .catch((err) => setError(err.message ?? "Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  // ── Derivações (lógica preservada) ──────────────────────────────────────────

  const now = new Date();

  const upcoming = entries.filter((e) => {
    const status = e.tournament.status?.toUpperCase();
    const start = new Date(e.tournament.startDate);
    return (
      ["OPEN", "PUBLISHED", "CLOSED", "ONGOING"].includes(status) ||
      start >= now
    );
  });

  const completed = entries.filter(
    (e) => e.tournament.status?.toUpperCase() === "COMPLETED",
  );
  const confirmed = entries.filter(
    (e) => e.status?.toUpperCase() === "CONFIRMED",
  );

  // ── Loading ──────────────────────────────────────────────────────────────────

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <AthleteHeader />
        <div className="flex flex-col items-center justify-center pt-32 gap-3 text-gray-500">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm">{error || "Erro ao carregar perfil."}</p>
        </div>
      </div>
    );
  }

  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Boas-vindas ───────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center text-[#0a0e1a] text-base font-extrabold flex-shrink-0 shadow-[0_0_16px_rgba(0,232,122,0.25)]">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(profile.fullName)
            )}
          </div>
          <div>
            <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
              Olá, {firstName}! 👋
            </h1>
            <p className="text-gray-500 text-sm font-normal">
              {location || "Bem-vindo ao Bubble Padel"}
            </p>
          </div>
        </div>

        {/* ── Banner pós-registro ───────────────────────────────────────────── */}
        {(() => {
          const profileItems = [
            { label: "Foto de perfil", done: !!profile.avatarUrl },
            { label: "Cidade", done: !!profile.city },
            { label: "Telefone", done: !!profile.phone },
            { label: "Esporte", done: (profile.sports?.length ?? 0) > 0 },
          ];
          const missing = profileItems.filter((i) => !i.done);
          if (bannerDismissed || missing.length === 0) return null;
          return (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 relative">
              <button
                onClick={() => {
                  localStorage.setItem(`bubble_profile_banner_${profile.id}`, "1");
                  setBannerDismissed(true);
                }}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                aria-label="Dispensar"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
              <div className="flex items-start gap-3 pr-8">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  👤
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-extrabold text-blue-900 mb-0.5 tracking-tight">
                    Complete seu perfil
                  </p>
                  <p className="text-[12px] text-blue-600 mb-3 font-normal">
                    {missing.length === 1
                      ? "Falta apenas 1 item para o perfil completo."
                      : `Faltam ${missing.length} itens para o perfil completo.`}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profileItems.map((item) => (
                      <span
                        key={item.label}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          item.done
                            ? "bg-green-100 text-green-700"
                            : "bg-white border border-blue-200 text-blue-500"
                        }`}
                      >
                        {item.done ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1.5 5l2.5 2.5L8.5 2" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="5" cy="5" r="4" />
                          </svg>
                        )}
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <Link
                    to="/athlete/settings"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-extrabold hover:bg-blue-700 transition-colors"
                  >
                    Completar perfil →
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Stat Cards ────────────────────────────────────────────────────── */}
        {/* Stat Cards — torneios */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            {
              label: "Inscrições",
              value: entries.length,
              color: "text-blue-600",
              bg: "bg-blue-50",
              icon: "🎾",
            },
            {
              label: "Confirmadas",
              value: confirmed.length,
              color: "text-green-600",
              bg: "bg-green-50",
              icon: "✅",
            },
            {
              label: "Concluídos",
              value: completed.length,
              color: "text-purple-600",
              bg: "bg-purple-50",
              icon: "🏆",
            },
          ].map(({ label, value, color, bg, icon }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              <div
                className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center text-sm mb-3`}
              >
                {icon}
              </div>
              <p
                className={`text-[28px] font-extrabold tracking-tight leading-none mb-1 ${color}`}
              >
                {value}
              </p>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Stat Cards — performance (aparece após stats carregarem) */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: "Vitórias",
                value: stats.wins,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                icon: "🏅",
              },
              {
                label: "Derrotas",
                value: stats.losses,
                color: "text-red-500",
                bg: "bg-red-50",
                icon: "📉",
              },
              {
                label: "Win Rate",
                value: `${stats.winRate}%`,
                color:
                  stats.winRate >= 50 ? "text-emerald-600" : "text-amber-600",
                bg: stats.winRate >= 50 ? "bg-emerald-50" : "bg-amber-50",
                icon: "📊",
              },
            ].map(({ label, value, color, bg, icon }) => (
              <div
                key={label}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                <div
                  className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center text-sm mb-3`}
                >
                  {icon}
                </div>
                <p
                  className={`text-[22px] font-extrabold tracking-tight leading-none mb-1 ${color}`}
                >
                  {value}
                </p>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Card resumo — total de partidas + parceiro top */}
        {stats && (stats.totalMatches > 0 || stats.topPartner) && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Histórico
              </p>
              <p className="text-[15px] font-extrabold text-gray-900">
                {stats.totalMatches} partida{stats.totalMatches !== 1 ? "s" : ""} em torneios completos
              </p>
            </div>
            {stats.topPartner && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#00e87a]/10 border border-[#00e87a]/20 flex items-center justify-center text-[12px] font-extrabold text-[#00e87a]">
                  {stats.topPartner.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-semibold">Parceiro Top</p>
                  <p className="text-[12px] font-extrabold text-gray-900 max-w-[90px] truncate">
                    {stats.topPartner.name.split(" ")[0]}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Lista de torneios ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight">
                  Meus Torneios
                </h2>
                <Link
                  to="/athlete/profile"
                  className="text-blue-600 text-[13px] font-semibold hover:text-blue-700 transition-colors"
                >
                  Ver histórico →
                </Link>
              </div>

              {entries.length === 0 ? (
                <div className="flex flex-col items-center text-center px-6 py-12">
                  <span className="text-4xl mb-3 block opacity-50">🎾</span>
                  <p className="text-[15px] font-extrabold text-gray-800 mb-1.5">
                    Nenhuma inscrição ainda
                  </p>
                  <p className="text-sm text-gray-500 mb-5 font-normal">
                    Encontre torneios abertos e inscreva-se para começar
                  </p>
                  <Link
                    to="/tournaments"
                    className="px-5 py-2.5 bg-[#00e87a] text-[#0a0e1a] rounded-xl font-extrabold text-sm hover:bg-[#00ff88] hover:shadow-[0_0_16px_rgba(0,232,122,0.3)] transition-all active:scale-[0.98]"
                  >
                    Explorar torneios
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {entries.slice(0, 5).map((entry) => {
                    const badge = statusBadge(entry.tournament.status);
                    return (
                      <Link
                        key={entry.id}
                        to={`/tournaments/${entry.tournament.id}`}
                        className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
                      >
                        {/* Ícone de esporte */}
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 group-hover:bg-gray-200 transition-colors">
                          {entry.tournament.sport?.toUpperCase() ===
                          "BEACH_TENNIS"
                            ? "🏖️"
                            : "🎾"}
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
                            {entry.tournament.club.name} ·{" "}
                            {entry.tournament.club.city}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-medium">
                            <span>
                              {normalizeSport(entry.tournament.sport)} ·{" "}
                              {entry.category}
                            </span>
                            <span>
                              {formatDate(entry.tournament.startDate)}
                            </span>
                            {entry.player2Name && (
                              <span className="hidden sm:inline">
                                🤝 {entry.player2Name.split(" ")[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        <svg
                          className="w-4 h-4 text-gray-300 group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    );
                  })}

                  {entries.length > 5 && (
                    <Link
                      to="/athlete/profile"
                      className="flex items-center justify-center gap-2 py-3.5 text-blue-600 text-[13px] font-bold hover:bg-blue-50 transition-colors"
                    >
                      Ver mais {entries.length - 5} inscrições →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Achievement preview — placeholder Sprint 8 */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight">
                  Conquistas
                </h2>
                <Link
                  to="/athlete/profile"
                  className="text-blue-600 text-[13px] font-semibold hover:text-blue-700 transition-colors"
                >
                  Ver todas →
                </Link>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#00e87a]/[0.06] to-[#00c8ff]/[0.03] border border-[#00e87a]/15 rounded-xl">
                <div className="w-12 h-12 bg-[#00e87a]/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🎾
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-gray-900 mb-1">
                    {entries.length === 0
                      ? "Primeiro Passo"
                      : entries.length >= 5
                        ? "Veterano"
                        : "Começando"}
                  </p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00e87a] to-[#00c8ff] rounded-full transition-all"
                      style={{
                        width: `${Math.min((entries.length / 5) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">
                    {entries.length} / 5 torneios para próxima conquista
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Perfil resumido */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-[14px] font-extrabold text-gray-900 mb-4 tracking-tight">
                Meu Perfil
              </h2>
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00e87a] to-[#00b85f] flex items-center justify-center text-[#0a0e1a] text-base font-extrabold mb-2.5 shadow-[0_0_12px_rgba(0,232,122,0.2)]">
                  {getInitials(profile.fullName)}
                </div>
                <p className="font-bold text-gray-900 text-[14px] mb-0.5">
                  {profile.fullName}
                </p>
                {location && (
                  <p className="text-gray-500 text-[12px]">{location}</p>
                )}
                {profile.user?.email && (
                  <p className="text-gray-400 text-[11px] mt-0.5 font-normal">
                    {profile.user.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-3 mb-4">
                <div>
                  <p className="text-[18px] font-extrabold text-gray-900 tracking-tight">
                    {entries.length}
                  </p>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Total
                  </p>
                </div>
                <div>
                  <p className="text-[18px] font-extrabold text-green-600 tracking-tight">
                    {confirmed.length}
                  </p>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Confirm.
                  </p>
                </div>
                <div>
                  <p className="text-[18px] font-extrabold text-purple-600 tracking-tight">
                    {completed.length}
                  </p>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Concluíd.
                  </p>
                </div>
              </div>

              <Link
                to="/athlete/profile"
                className="block w-full text-center py-2.5 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors"
              >
                Ver perfil completo →
              </Link>
            </div>

            {/* CTA Explorar */}
            <div className="bg-gradient-to-br from-[#0a0e1a] to-[#141824] rounded-2xl p-5">
              <p className="text-[13px] font-extrabold text-[#f0f4ff] mb-1.5 tracking-tight">
                Encontre torneios 🎾
              </p>
              <p className="text-[12px] text-[#6b7a99] mb-4 font-normal leading-relaxed">
                Descubra torneios abertos na sua cidade e região.
              </p>
              <Link
                to="/tournaments"
                className="block w-full text-center py-2.5 bg-[#00e87a] text-[#0a0e1a] rounded-xl font-extrabold text-[13px] hover:bg-[#00ff88] hover:shadow-[0_0_16px_rgba(0,232,122,0.3)] transition-all active:scale-[0.98]"
              >
                Explorar torneios →
              </Link>
            </div>

            {/* Próximo torneio destaque */}
            {upcoming.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Próximo
                </p>
                <Link
                  to={`/tournaments/${upcoming[0].tournament.id}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <p className="font-bold text-gray-900 text-[14px] mb-1 line-clamp-2">
                    {upcoming[0].tournament.name}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {formatDate(upcoming[0].tournament.startDate)}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {upcoming[0].category}
                  </p>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Bottom Nav — Mobile Atleta ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe z-50">
        <div className="flex">
          <Link
            to="/athlete/dashboard"
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathLocation.pathname === "/athlete/dashboard" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
          >
            <span className="text-xl leading-none">🏠</span>Início
          </Link>
          <Link
            to="/athlete/feed"
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathLocation.pathname === "/athlete/feed" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
          >
            <span className="text-xl leading-none">📰</span>Feed
          </Link>
          <Link
            to="/tournaments"
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathLocation.pathname === "/tournaments" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
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
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathLocation.pathname === "/athlete/profile" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
          >
            <span className="text-xl leading-none">👤</span>Perfil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
