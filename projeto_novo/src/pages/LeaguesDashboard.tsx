import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface League {
  id: string;
  name: string;
  description: string;
  sport: string | null;
  status: string;
  pointsChampion: number;
  pointsRunnerUp: number;
  pointsSemi: number;
  pointsQuarter: number;
  pointsGroup: number;
  createdAt: string;
  _count?: { members: number; tournaments: number };
}

interface LeagueMember {
  id: string;
  clubId: string;
  status: string;
  joinedAt: string | null;
  club: { id: string; name: string; city: string };
}

interface LeagueTournament {
  id: string;
  tournamentId: string;
  pointsChampion: number | null;
  pointsRunnerUp: number | null;
  pointsSemi: number | null;
  pointsQuarter: number | null;
  pointsGroup: number | null;
  tournament: {
    id: string;
    name: string;
    sport: string;
    status: string;
    startDate: string;
    endDate: string;
    categories: string[];
  };
}

interface LeagueDetail extends League {
  createdByClub: { id: string; name: string; city: string };
  members: LeagueMember[];
  tournaments: LeagueTournament[];
}

interface RankingEntry {
  position: number;
  points: number;
  athlete: {
    id: string;
    fullName: string;
    city?: string;
    avatarUrl?: string | null;
  };
}

interface PendingInvite {
  memberId: string;
  id: string;
  name: string;
  createdByClub: { name: string };
  _count: { members: number; tournaments: number };
}

interface TournamentOption {
  id: string;
  name: string;
  status: string;
  startDate: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const token = () => localStorage.getItem("auth_token") ?? "";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});

const api = {
  getLeagues: async () => {
    const res = await fetch(`${API_URL}/leagues`, { headers: headers() });
    const j = await res.json();
    return j.data as {
      created: League[];
      member: League[];
      invites: PendingInvite[];
    };
  },
  getLeague: async (id: string) => {
    const res = await fetch(`${API_URL}/leagues/${id}`, { headers: headers() });
    const j = await res.json();
    return j.data as LeagueDetail;
  },
  createLeague: async (body: object) => {
    const res = await fetch(`${API_URL}/leagues`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro ao criar liga");
    return j.data as League;
  },
  inviteClub: async (leagueId: string, email: string) => {
    const res = await fetch(`${API_URL}/leagues/${leagueId}/invite`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro ao convidar clube");
    return j.data;
  },
  acceptInvite: async (leagueId: string, clubId: string) => {
    const res = await fetch(
      `${API_URL}/leagues/${leagueId}/members/${clubId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ action: "accept" }),
      },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro");
    return j.data;
  },
  declineInvite: async (leagueId: string, clubId: string) => {
    const res = await fetch(
      `${API_URL}/leagues/${leagueId}/members/${clubId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ action: "decline" }),
      },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro");
    return j.data;
  },
  linkTournament: async (leagueId: string, body: object) => {
    const res = await fetch(`${API_URL}/leagues/${leagueId}/tournaments`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro ao vincular torneio");
    return j.data;
  },
  unlinkTournament: async (leagueId: string, tournamentId: string) => {
    const res = await fetch(
      `${API_URL}/leagues/${leagueId}/tournaments/${tournamentId}`,
      { method: "DELETE", headers: headers() },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro ao desvincular");
    return j.data;
  },
  getRanking: async (leagueId: string, category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    const res = await fetch(`${API_URL}/leagues/${leagueId}/ranking${qs}`, {
      headers: headers(),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro ao carregar ranking");
    return j.data as { league: { name: string }; ranking: RankingEntry[] };
  },
  getMyTournaments: async () => {
    const res = await fetch(`${API_URL}/tournaments`, { headers: headers() });
    const j = await res.json();
    return (j.data ?? []) as TournamentOption[];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeSport(s: string | null) {
  switch (s?.toUpperCase()) {
    case "PADEL":
      return "Padel";
    case "BEACH_TENNIS":
      return "Beach Tennis";
    case "TENIS":
      return "Tênis";
    case "PICKLEBALL":
      return "Pickleball";
    default:
      return s ?? "Todos os esportes";
  }
}

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Criar Liga
// ─────────────────────────────────────────────────────────────────────────────

interface CreateLeagueModalProps {
  onClose: () => void;
  onCreated: (league: League) => void;
}

const CreateLeagueModal = ({ onClose, onCreated }: CreateLeagueModalProps) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    sport: "",
    pointsChampion: 100,
    pointsRunnerUp: 70,
    pointsSemi: 45,
    pointsQuarter: 25,
    pointsGroup: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const league = await api.createLeague({
        ...form,
        sport: form.sport || null,
      });
      onCreated(league);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Criar Nova Liga</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Nome da Liga *</label>
            <input
              className={inputCls}
              placeholder="Ex: Liga BT Rio 2026"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Descrição</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Descrição opcional"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Esporte</label>
            <select
              className={inputCls}
              value={form.sport}
              onChange={(e) =>
                setForm((f) => ({ ...f, sport: e.target.value }))
              }
            >
              <option value="">Todos os esportes</option>
              <option value="PADEL">Padel</option>
              <option value="BEACH_TENNIS">Beach Tennis</option>
              <option value="TENIS">Tênis</option>
              <option value="PICKLEBALL">Pickleball</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Pontos por Posição (padrão)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "pointsChampion", label: "🥇 Campeão" },
                { key: "pointsRunnerUp", label: "🥈 Vice-campeão" },
                { key: "pointsSemi", label: "🥉 Semifinal" },
                { key: "pointsQuarter", label: "Quartas" },
                { key: "pointsGroup", label: "Fase de Grupos" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={(form as any)[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Criando..." : "Criar Liga"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Convidar Clube
// ─────────────────────────────────────────────────────────────────────────────

const InviteModal = ({
  leagueId,
  onClose,
  onInvited,
}: {
  leagueId: string;
  onClose: () => void;
  onInvited: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Informe o email do clube.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.inviteClub(leagueId, email.trim());
      setSuccess(true);
      setTimeout(() => {
        onInvited();
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Convidar Clube</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {success ? (
          <div className="text-center py-6">
            <span className="text-4xl">✅</span>
            <p className="mt-3 font-semibold text-gray-800">Convite enviado!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Informe o email de cadastro do clube que deseja convidar para a
              liga.
            </p>
            <input
              type="email"
              placeholder="email@clube.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors mb-3"
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Enviando..." : "Convidar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Vincular Torneio
// ─────────────────────────────────────────────────────────────────────────────

const LinkTournamentModal = ({
  leagueId,
  league,
  onClose,
  onLinked,
}: {
  leagueId: string;
  league: LeagueDetail;
  onClose: () => void;
  onLinked: () => void;
}) => {
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [selected, setSelected] = useState("");
  const [useOverride, setUseOverride] = useState(false);
  const [pts, setPts] = useState({
    pointsChampion: league.pointsChampion,
    pointsRunnerUp: league.pointsRunnerUp,
    pointsSemi: league.pointsSemi,
    pointsQuarter: league.pointsQuarter,
    pointsGroup: league.pointsGroup,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Torneios elegíveis: DRAFT ou PUBLISHED, ainda não vinculados
  const linkedIds = new Set(league.tournaments.map((t) => t.tournamentId));
  const eligible = tournaments.filter(
    (t) =>
      ["DRAFT", "PUBLISHED"].includes(t.status.toUpperCase()) &&
      !linkedIds.has(t.id),
  );

  useEffect(() => {
    api.getMyTournaments().then(setTournaments).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!selected) {
      setError("Selecione um torneio.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.linkTournament(leagueId, {
        tournamentId: selected,
        ...(useOverride ? pts : {}),
      });
      onLinked();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Vincular Torneio à Liga
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Torneio
            </label>
            {eligible.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">
                Nenhum torneio elegível (somente torneios em Rascunho ou
                Publicado, ainda não vinculados).
              </p>
            ) : (
              <select
                className={inputCls}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Selecione um torneio...</option>
                {eligible.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="override"
              checked={useOverride}
              onChange={(e) => setUseOverride(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label
              htmlFor="override"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Usar pontuação diferente para este torneio
            </label>
          </div>

          {useOverride && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
                Override de Pontos
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "pointsChampion", label: "🥇 Campeão" },
                  { key: "pointsRunnerUp", label: "🥈 Vice" },
                  { key: "pointsSemi", label: "🥉 Semifinal" },
                  { key: "pointsQuarter", label: "Quartas" },
                  { key: "pointsGroup", label: "Grupos" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={(pts as any)[key]}
                      onChange={(e) =>
                        setPts((p) => ({ ...p, [key]: Number(e.target.value) }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!useOverride && (
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
              Serão usados os pontos padrão da liga: Campeão{" "}
              {league.pointsChampion}pts · Vice {league.pointsRunnerUp}pts ·
              Semi {league.pointsSemi}pts · Quartas {league.pointsQuarter}pts ·
              Grupos {league.pointsGroup}pts
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || eligible.length === 0}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Vinculando..." : "Vincular"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEAGUE DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────

const LeagueDetail = ({
  leagueId,
  myClubId,
  onBack,
}: {
  leagueId: string;
  myClubId: string;
  onBack: () => void;
}) => {
  const [league, setLeague] = useState<LeagueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "tournaments" | "ranking"
  >("overview");
  const [showInvite, setShowInvite] = useState(false);
  const [showLinkTournament, setShowLinkTournament] = useState(false);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const isCreator = league?.createdByClub.id === myClubId;

  const reload = useCallback(async () => {
    try {
      const data = await api.getLeague(leagueId);
      setLeague(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (activeTab !== "ranking" || !league) return;
    setRankingLoading(true);
    api
      .getRanking(leagueId)
      .then((r) => setRanking(r.ranking))
      .catch(console.error)
      .finally(() => setRankingLoading(false));
  }, [activeTab, leagueId, league]);

  const handleUnlink = async (tournamentId: string) => {
    if (!window.confirm("Desvincular este torneio da liga?")) return;
    try {
      await api.unlinkTournament(leagueId, tournamentId);
      reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!league) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p>Liga não encontrada.</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 text-sm hover:underline"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Visão Geral" },
    { key: "members", label: `Membros (${league.members.length})` },
    { key: "tournaments", label: `Torneios (${league.tournaments.length})` },
    { key: "ranking", label: "Ranking" },
  ] as const;

  return (
    <>
      {showInvite && (
        <InviteModal
          leagueId={leagueId}
          onClose={() => setShowInvite(false)}
          onInvited={reload}
        />
      )}
      {showLinkTournament && (
        <LinkTournamentModal
          leagueId={leagueId}
          league={league}
          onClose={() => setShowLinkTournament(false)}
          onLinked={reload}
        />
      )}

      {/* Header da Liga */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Todas as ligas
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-black flex-shrink-0">
                🏆
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {league.name}
                </h1>
                {league.description && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {league.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {league.sport && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                      {normalizeSport(league.sport)}
                    </span>
                  )}
                  <span>Criada por {league.createdByClub.name}</span>
                  <span>·</span>
                  <span>{league.members.length} membros</span>
                  <span>·</span>
                  <span>{league.tournaments.length} torneios</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCreator && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Convidar Clube
                </button>
              )}
              <button
                onClick={() => setShowLinkTournament(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Vincular Torneio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                activeTab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Visão Geral */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "🥇 Campeão", value: league.pointsChampion },
            { label: "🥈 Vice", value: league.pointsRunnerUp },
            { label: "🥉 Semifinal", value: league.pointsSemi },
            { label: "Quartas", value: league.pointsQuarter },
            { label: "Grupos", value: league.pointsGroup },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center"
            >
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">pts</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Membros */}
      {activeTab === "members" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Criador */}
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {getInitials(league.createdByClub.name)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {league.createdByClub.name}
              </p>
              <p className="text-xs text-gray-500">
                {league.createdByClub.city}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
              Criador
            </span>
          </div>
          {/* Membros */}
          {league.members.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              Nenhum membro convidado ainda.
              {isCreator && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="block mx-auto mt-3 text-blue-600 hover:underline text-sm font-semibold"
                >
                  Convidar clube →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {league.members.map((m) => (
                <div key={m.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                    {getInitials(m.club.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {m.club.name}
                    </p>
                    <p className="text-xs text-gray-500">{m.club.city}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      m.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {m.status === "ACTIVE" ? "Membro" : "Convidado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Torneios */}
      {activeTab === "tournaments" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {league.tournaments.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              Nenhum torneio vinculado.
              <button
                onClick={() => setShowLinkTournament(true)}
                className="block mx-auto mt-3 text-blue-600 hover:underline text-sm font-semibold"
              >
                Vincular torneio →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {league.tournaments.map((lt) => {
                const hasOverride = lt.pointsChampion !== null;
                return (
                  <div key={lt.id} className="px-5 py-4 flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/tournaments/${lt.tournament.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {lt.tournament.name}
                        </Link>
                        {hasOverride && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded">
                            Pontos customizados
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {normalizeSport(lt.tournament.sport)} ·{" "}
                        {lt.tournament.categories.join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlink(lt.tournamentId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Desvincular torneio"
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
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Ranking */}
      {activeTab === "ranking" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {rankingLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ranking.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              Nenhum ponto distribuído ainda. O ranking aparece após o primeiro
              torneio ser concluído.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">
                    #
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Atleta
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranking.map((r) => (
                  <tr
                    key={r.position}
                    className={`${r.position <= 3 ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <span
                        className={`text-sm font-bold ${
                          r.position === 1
                            ? "text-amber-500"
                            : r.position === 2
                              ? "text-gray-500"
                              : r.position === 3
                                ? "text-amber-700"
                                : "text-gray-400"
                        }`}
                      >
                        {r.position === 1
                          ? "🥇"
                          : r.position === 2
                            ? "🥈"
                            : r.position === 3
                              ? "🥉"
                              : r.position}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                          {getInitials((r.athlete as any).fullName ?? "?")}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {(r.athlete as any).fullName ?? "—"}
                          </p>
                          {(r.athlete as any).city && (
                            <p className="text-xs text-gray-400">
                              {(r.athlete as any).city}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-gray-900">
                        {r.points}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">pts</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const LeaguesDashboard = () => {
  const [data, setData] = useState<{
    created: League[];
    member: League[];
    invites: PendingInvite[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  // myClubId extraído do localStorage (auth_user)
  const myClubId: string = (() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (!raw) return "";
      const u = JSON.parse(raw);
      return u.clubId ?? u.club?.id ?? "";
    } catch {
      return "";
    }
  })();

  const reload = useCallback(async () => {
    try {
      const result = await api.getLeagues();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAcceptInvite = async (invite: PendingInvite) => {
    try {
      await api.acceptInvite(invite.id, myClubId);
      reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeclineInvite = async (invite: PendingInvite) => {
    try {
      await api.declineInvite(invite.id, myClubId);
      reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── Se tem liga selecionada, mostra o detalhe ─────────────────────────────
  if (selectedLeagueId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader activePage="leagues" />
        <main className="pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-6">
            <LeagueDetail
              leagueId={selectedLeagueId}
              myClubId={myClubId}
              onBack={() => setSelectedLeagueId(null)}
            />
          </div>
        </main>
      </div>
    );
  }

  const allLeagues = [...(data?.created ?? []), ...(data?.member ?? [])];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader activePage="leagues" />

      {showCreate && (
        <CreateLeagueModal
          onClose={() => setShowCreate(false)}
          onCreated={(league) => {
            setShowCreate(false);
            reload();
            setSelectedLeagueId(league.id);
          }}
        />
      )}

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Ligas</h1>
              <p className="text-sm text-gray-500">
                Gerencie ligas, convide clubes e acompanhe o ranking de atletas.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Criar Liga
            </button>
          </div>

          {/* Convites pendentes */}
          {(data?.invites ?? []).length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Convites Pendentes ({data!.invites.length})
              </h2>
              <div className="space-y-3">
                {data!.invites.map((invite) => (
                  <div
                    key={invite.memberId}
                    className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {invite.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Convite de {invite.createdByClub?.name} ·{" "}
                        {invite._count?.tournaments ?? 0} torneios ·{" "}
                        {invite._count?.members ?? 0} membros
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeclineInvite(invite)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleAcceptInvite(invite)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        Aceitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Ligas */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allLeagues.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <span className="text-5xl block mb-4">🏆</span>
              <h3 className="text-base font-bold text-gray-800 mb-2">
                Nenhuma liga ainda
              </h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                Crie sua primeira liga para organizar torneios em circuito e
                gerar um ranking de atletas.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Criar primeira liga
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allLeagues.map((league) => {
                const isCreator = data?.created.some((c) => c.id === league.id);
                return (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeagueId(league.id)}
                    className="w-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
                        🏆
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 truncate">
                            {league.name}
                          </p>
                          {isCreator && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                              Criador
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {league._count?.members ?? 0} membros ·{" "}
                          {league._count?.tournaments ?? 0} torneios
                          {league.sport
                            ? ` · ${normalizeSport(league.sport)}`
                            : ""}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaguesDashboard;
