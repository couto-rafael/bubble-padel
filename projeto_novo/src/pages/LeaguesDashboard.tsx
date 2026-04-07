import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
    return (await res.json()).data as {
      created: League[];
      member: League[];
      invites: PendingInvite[];
    };
  },
  getLeague: async (id: string) => {
    const res = await fetch(`${API_URL}/leagues/${id}`, { headers: headers() });
    return (await res.json()).data as LeagueDetail;
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
    return j;
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
  getRanking: async (leagueId: string) => {
    const res = await fetch(`${API_URL}/leagues/${leagueId}/ranking`, {
      headers: headers(),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Erro ao carregar ranking");
    return j.data as {
      league: { name: string };
      categories: Record<string, RankingEntry[]>;
      availableCategories: string[];
    };
  },
  getMyTournaments: async () => {
    const res = await fetch(`${API_URL}/tournaments`, { headers: headers() });
    return ((await res.json()).data ?? []) as TournamentOption[];
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

const inputCls =
  "w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all placeholder:text-gray-300 placeholder:font-normal";
const labelCls = "block text-[12px] font-semibold text-gray-500 mb-1.5";

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Criar Liga
// ─────────────────────────────────────────────────────────────────────────────

const CreateLeagueModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (l: League) => void;
}) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    sport: "",
    pointsChampion: 100,
    pointsRunnerUp: 70,
    pointsSemi: 45,
    pointsQuarter: 25,
    pointsGroup: 10,
    pointsRound16: null as number | null,
    pointsRound32: null as number | null,
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
            Criar Nova Liga
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
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
            <p className="text-[11px] font-bold text-gray-500 mb-3 uppercase tracking-widest">
              Pontos por Posição
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "pointsChampion", label: "🥇 Campeão" },
                { key: "pointsRunnerUp", label: "🥈 Vice-campeão" },
                { key: "pointsSemi", label: "🥉 Semifinal" },
                { key: "pointsQuarter", label: "Quartas de Final" },
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
              <div>
                <label className={labelCls}>
                  Oitavas{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="ex: 15"
                  className={inputCls}
                  value={form.pointsRound16 ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pointsRound16:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>
                  16avos{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="ex: 5"
                  className={inputCls}
                  value={form.pointsRound32 ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pointsRound32:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Fase de Grupos</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.pointsGroup}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pointsGroup: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Oitavas e 16avos: deixe vazio se o torneio não tiver essa fase.
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Informe o email do clube.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const j = await api.inviteClub(leagueId, email.trim());
      setSuccessMsg(j.message ?? "Convite enviado!");
      if (j.data) {
        setTimeout(() => {
          onInvited();
          onClose();
        }, 1800);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
            Convidar Clube
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
        {successMsg ? (
          <div className="text-center py-6">
            <span className="text-4xl block mb-3">✅</span>
            <p className="font-semibold text-gray-800">{successMsg}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4 font-normal leading-relaxed">
              Informe o email de cadastro do clube. Se não estiver cadastrado,
              enviaremos um convite para criar conta.
            </p>
            <input
              type="email"
              placeholder="email@clube.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className={`${inputCls} mb-3`}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-3">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
            Vincular Torneio
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Torneio</label>
            {eligible.length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 px-4 py-3 rounded-xl">
                Nenhum torneio elegível. Crie um torneio em rascunho ou
                publicado.
              </p>
            ) : (
              <select
                className={inputCls}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Selecione um torneio</option>
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
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <label
              htmlFor="override"
              className="text-sm text-gray-700 font-medium cursor-pointer"
            >
              Usar pontuação diferente da liga para este torneio
            </label>
          </div>
          {useOverride && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
              {[
                { key: "pointsChampion", label: "🥇 Campeão" },
                { key: "pointsRunnerUp", label: "🥈 Vice" },
                { key: "pointsSemi", label: "🥉 Semifinal" },
                { key: "pointsQuarter", label: "Quartas" },
                { key: "pointsGroup", label: "Grupos" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
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
          )}
          {!useOverride && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700 font-normal">
              Pontos padrão da liga: Campeão {league.pointsChampion}pts · Vice{" "}
              {league.pointsRunnerUp}pts · Semi {league.pointsSemi}pts · Quartas{" "}
              {league.pointsQuarter}pts · Grupos {league.pointsGroup}pts
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || eligible.length === 0}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

const LeagueDetailView = ({
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
  const [rankingData, setRankingData] = useState<{
    categories: Record<string, RankingEntry[]>;
    availableCategories: string[];
  } | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingCategory, setRankingCategory] = useState<string>("");

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
      .then((r) => {
        setRankingData(r);
        if (r.availableCategories.length > 0 && !rankingCategory)
          setRankingCategory(r.availableCategories[0]);
      })
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

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin inline-block" />
      </div>
    );

  if (!league)
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-sm">Liga não encontrada.</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 text-sm hover:underline font-semibold"
        >
          ← Voltar
        </button>
      </div>
    );

  // ── Bug fix P0: totalMembers inclui o criador ──────────────────────────────
  const totalMembers = league.members.length + 1;

  const tabs = [
    { key: "overview" as const, label: "Visão Geral" },
    { key: "members" as const, label: `Membros (${totalMembers})` },
    {
      key: "tournaments" as const,
      label: `Torneios (${league.tournaments.length})`,
    },
    { key: "ranking" as const, label: "Ranking" },
  ];

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

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors font-semibold flex items-center gap-1"
        >
          ← Todas as ligas
        </button>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-black flex-shrink-0">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
                    {league.name}
                  </h1>
                  {league.sport && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full">
                      {normalizeSport(league.sport)}
                    </span>
                  )}
                </div>
                {league.description && (
                  <p className="text-sm text-gray-500 font-normal mb-1">
                    {league.description}
                  </p>
                )}
                <p className="text-[12px] text-gray-400">
                  Por {league.createdByClub.name} · {totalMembers} membros ·{" "}
                  {league.tournaments.length} torneios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/leagues/${leagueId}`}
                target="_blank"
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                🌐 Página pública
              </Link>
              {isCreator && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  + Convidar
                </button>
              )}
              <button
                onClick={() => setShowLinkTournament(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                🔗 Vincular Torneio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LineTabs DS */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px transition-all duration-150 ${
              activeTab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Visão Geral */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "🥇 Campeão", value: league.pointsChampion },
            { label: "🥈 Vice", value: league.pointsRunnerUp },
            { label: "🥉 Semifinal", value: league.pointsSemi },
            { label: "Quartas", value: league.pointsQuarter },
            { label: "Grupos", value: league.pointsGroup },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center"
            >
              <p className="text-[11px] text-gray-500 mb-1 font-medium">
                {label}
              </p>
              <p className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">
                {value}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">pts</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Membros */}
      {activeTab === "members" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Criador */}
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(league.createdByClub.name)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">
                {league.createdByClub.name}
              </p>
              <p className="text-xs text-gray-500 font-normal">
                {league.createdByClub.city}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full">
              Criador
            </span>
          </div>
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
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                    {getInitials(m.club.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {m.club.name}
                    </p>
                    <p className="text-xs text-gray-500 font-normal">
                      {m.club.city}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      m.status === "ACTIVE"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
              {league.tournaments.map((lt) => (
                <div key={lt.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <Link
                        to={`/tournaments/${lt.tournament.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {lt.tournament.name}
                      </Link>
                      {lt.pointsChampion !== null && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded">
                          Pts custom
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-400 font-normal">
                      {normalizeSport(lt.tournament.sport)} ·{" "}
                      {lt.tournament.categories.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnlink(lt.tournamentId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    title="Desvincular"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Ranking */}
      {activeTab === "ranking" && (
        <div className="space-y-4">
          {rankingLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-12 flex justify-center">
              <span className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin inline-block" />
            </div>
          ) : !rankingData || rankingData.availableCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-10 text-center text-gray-400 text-sm">
              Nenhum ponto distribuído ainda. O ranking aparece após o primeiro
              torneio ser concluído.
            </div>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                {rankingData.availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setRankingCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      rankingCategory === cat
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {rankingCategory && rankingData.categories[rankingCategory] && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                      {rankingCategory}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {rankingData.categories[rankingCategory].map((r) => (
                      <div
                        key={r.position}
                        className={`flex items-center gap-4 px-5 py-3.5 ${r.position <= 3 ? "bg-amber-50/40" : ""}`}
                      >
                        <span
                          className={`text-[15px] font-extrabold w-8 text-center flex-shrink-0 ${
                            r.position === 1
                              ? "text-amber-500"
                              : r.position === 2
                                ? "text-gray-400"
                                : r.position === 3
                                  ? "text-amber-700"
                                  : "text-gray-300"
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
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[11px] font-bold text-gray-600 flex-shrink-0">
                          {getInitials((r.athlete as any).fullName ?? "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {(r.athlete as any).fullName ?? "—"}
                          </p>
                          {(r.athlete as any).city && (
                            <p className="text-[11px] text-gray-400 font-normal">
                              {(r.athlete as any).city}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-gray-900 text-[16px] tracking-tight">
                            {r.points}
                          </span>
                          <span className="text-[11px] text-gray-400 ml-1">
                            pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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

  // URL sync — ?league=:id
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLeagueId = searchParams.get("league");
  const setSelectedLeagueId = (id: string | null) => {
    if (id) setSearchParams({ league: id });
    else setSearchParams({});
  };

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

  if (selectedLeagueId) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <DashboardHeader activePage="leagues" />
        <main className="pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-6">
            <LeagueDetailView
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
    <div className="min-h-screen bg-[#f8f9fc]">
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-1">
                Ligas
              </h1>
              <p className="text-sm text-gray-500 font-normal">
                Gerencie ligas, convide clubes e acompanhe o ranking de atletas.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Criar Liga
            </button>
          </div>

          {/* Convites pendentes */}
          {(data?.invites ?? []).length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                Convites Pendentes ({data!.invites.length})
              </p>
              <div className="space-y-3">
                {data!.invites.map((invite) => (
                  <div
                    key={invite.memberId}
                    className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {invite.name}
                      </p>
                      <p className="text-xs text-gray-500 font-normal">
                        Convite de {invite.createdByClub?.name} ·{" "}
                        {invite._count?.tournaments ?? 0} torneios ·{" "}
                        {invite._count?.members ?? 0} membros
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDeclineInvite(invite)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleAcceptInvite(invite)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
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
              <span className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin inline-block" />
            </div>
          ) : allLeagues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
              <span className="text-5xl block mb-4">🏆</span>
              <h3 className="text-[15px] font-extrabold text-gray-800 mb-2">
                Nenhuma liga ainda
              </h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto font-normal">
                Crie sua primeira liga para organizar torneios em circuito e
                gerar um ranking de atletas.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                Criar primeira liga
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allLeagues.map((league) => {
                const isCreator = data?.created.some((c) => c.id === league.id);
                // Bug fix P0: +1 para incluir o criador
                const memberCount = (league._count?.members ?? 0) + 1;
                return (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeagueId(league.id)}
                    className="w-full bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
                        🏆
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-bold text-gray-900 truncate text-[15px]">
                            {league.name}
                          </p>
                          {isCreator && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded">
                              Criador
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-400 font-normal">
                          {memberCount} membros ·{" "}
                          {league._count?.tournaments ?? 0} torneios
                          {league.sport
                            ? ` · ${normalizeSport(league.sport)}`
                            : ""}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-300 flex-shrink-0"
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
