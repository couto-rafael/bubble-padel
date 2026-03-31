import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AthleteProfile {
  id: string;
  fullName: string;
  city?: string;
  state?: string;
  avatarUrl?: string | null;
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
      return {
        label: "Inscrições abertas",
        cls: "bg-[#00ff88]/20 text-[#00ff88]",
      };
    case "PUBLISHED":
      return { label: "Em breve", cls: "bg-blue-500/20 text-blue-400" };
    case "CLOSED":
      return {
        label: "Aguardando início",
        cls: "bg-amber-500/20 text-amber-400",
      };
    case "ONGOING":
      return { label: "Em andamento", cls: "bg-purple-500/20 text-purple-400" };
    case "COMPLETED":
      return { label: "Concluído", cls: "bg-gray-500/20 text-gray-400" };
    default:
      return { label: tournamentStatus, cls: "bg-gray-500/20 text-gray-400" };
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchProfile(), fetchTournaments()])
      .then(([p, t]) => {
        setProfile(p);
        setEntries(t);
      })
      .catch((err) => setError(err.message ?? "Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  // ── Derivações ──────────────────────────────────────────────────────────────

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

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1540] to-[#0a0e27]">
        <AthleteHeader />
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1540] to-[#0a0e27]">
        <AthleteHeader />
        <div className="flex items-center justify-center pt-32 text-gray-400">
          {error || "Erro ao carregar perfil."}
        </div>
      </div>
    );
  }

  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1540] to-[#0a0e27]">
      <AthleteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Boas-vindas ─────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00cc6a] flex items-center justify-center text-[#0a0e27] text-xl font-black flex-shrink-0">
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
            <h2 className="text-2xl font-black text-white">
              Olá, {profile.fullName.split(" ")[0]}! 👋
            </h2>
            <p className="text-gray-400 text-sm">
              {location || "Bem-vindo ao Bubble Padel"}
            </p>
          </div>
        </div>

        {/* ── Cards de stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#00ff88]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">
              {entries.length}
            </h3>
            <p className="text-gray-400 text-sm">Inscrições no total</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
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
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">
              {upcoming.length}
            </h3>
            <p className="text-gray-400 text-sm">Próximos torneios</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">
              {completed.length}
            </h3>
            <p className="text-gray-400 text-sm">Torneios concluídos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Próximos torneios ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">Meus Torneios</h3>
                <Link
                  to="/athlete/profile"
                  className="text-[#00ff88] text-sm font-semibold hover:text-[#00dd77] transition-colors"
                >
                  Ver histórico →
                </Link>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#00ff88]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-[#00ff88]"
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
                  </div>
                  <h3 className="text-white font-bold mb-2">
                    Nenhuma inscrição ainda
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Encontre torneios abertos e inscreva-se para começar.
                  </p>
                  <Link
                    to="/tournaments"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-[#00ff88] to-[#00dd77] text-[#0a0e27] rounded-lg font-bold transition-all hover:scale-[1.02]"
                  >
                    Explorar torneios
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 5).map((entry) => {
                    const badge = statusBadge(entry.tournament.status);
                    return (
                      <Link
                        key={entry.id}
                        to={`/tournaments/${entry.tournament.id}`}
                        className="block bg-[#0a0e27]/50 rounded-lg p-4 border border-white/5 hover:border-[#00ff88]/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">
                              {entry.tournament.name}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {entry.tournament.club.name} ·{" "}
                              {entry.tournament.club.city}
                            </p>
                          </div>
                          <span
                            className={`ml-3 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {normalizeSport(entry.tournament.sport)} ·{" "}
                            {entry.category}
                          </span>
                          <span>{formatDate(entry.tournament.startDate)}</span>
                          {entry.player2Name && (
                            <span>
                              Parceiro: {entry.player2Name.split(" ")[0]}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}

                  {entries.length > 5 && (
                    <Link
                      to="/athlete/profile"
                      className="block text-center py-3 text-[#00ff88] text-sm font-semibold hover:text-[#00dd77] transition-colors"
                    >
                      Ver mais {entries.length - 5} inscrições →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Perfil resumido */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-4">Meu Perfil</h3>
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00cc6a] flex items-center justify-center text-[#0a0e27] text-xl font-black mb-3">
                  {getInitials(profile.fullName)}
                </div>
                <p className="font-bold text-white">{profile.fullName}</p>
                {location && (
                  <p className="text-gray-400 text-sm">{location}</p>
                )}
                {profile.user?.email && (
                  <p className="text-gray-500 text-xs mt-1">
                    {profile.user.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center border-t border-white/10 pt-4">
                <div>
                  <p className="text-xl font-black text-white">
                    {entries.length}
                  </p>
                  <p className="text-gray-500 text-xs">Inscrições</p>
                </div>
                <div>
                  <p className="text-xl font-black text-white">
                    {confirmed.length}
                  </p>
                  <p className="text-gray-500 text-xs">Confirmadas</p>
                </div>
                <div>
                  <p className="text-xl font-black text-white">
                    {completed.length}
                  </p>
                  <p className="text-gray-500 text-xs">Concluídos</p>
                </div>
              </div>
              <Link
                to="/athlete/profile"
                className="mt-4 block w-full text-center py-2.5 border border-white/20 text-gray-300 rounded-lg text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Ver perfil completo →
              </Link>
            </div>

            {/* Encontrar torneios */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-[#00ff88]/20 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-2">
                Encontre torneios
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Descubra torneios abertos na sua cidade.
              </p>
              <Link
                to="/tournaments"
                className="block w-full text-center py-3 bg-gradient-to-r from-[#00ff88] to-[#00dd77] text-[#0a0e27] rounded-lg font-bold text-sm transition-all hover:scale-[1.02]"
              >
                Explorar torneios →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthleteDashboard;
