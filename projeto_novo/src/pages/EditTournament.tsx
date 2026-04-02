import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import { useTournaments, useTeams, useGroups } from "../hooks";
import type { Tournament } from "../types";
import TabGrupos from "../components/TabGrupos";
import TabJogos from "../components/TabJogos";
import TabPlayoffs from "../components/TabPlayoffs";
import TabInscricoes from "../components/TabInscricoes";
import TabFinanceiro from "../components/TabFinanceiro";
import { calculateCapacity } from "../utils/groupUtils";

// ─── TIPOS ────────────────────────────────────────────────
type Tab =
  | "torneio"
  | "estrutura"
  | "inscricoes"
  | "categorias"
  | "financeiro"
  | "grupos"
  | "jogos"
  | "playoffs";

// ─── STATUS BADGE ─────────────────────────────────────────
const StatusBadge = ({
  status,
}: {
  status: "draft" | "published" | "open" | "closed" | "ongoing" | "completed";
}) => {
  const config = {
    draft: {
      bg: "bg-amber-100 border-2 border-amber-500",
      text: "text-amber-900",
      dot: "bg-amber-600",
      label: "⚠️ RASCUNHO",
      shadow: "shadow-lg shadow-amber-200",
    },
    published: {
      bg: "bg-emerald-50 border-2 border-emerald-400",
      text: "text-emerald-800",
      dot: "bg-emerald-600",
      label: "✓ Publicado",
      shadow: "",
    },
    open: {
      bg: "bg-green-100 border-2 border-green-500",
      text: "text-green-900",
      dot: "bg-green-600",
      label: "🟢 Inscrições Abertas",
      shadow: "shadow-lg shadow-green-200",
    },
    closed: {
      bg: "bg-red-50 border-2 border-red-400",
      text: "text-red-800",
      dot: "bg-red-500",
      label: "🔴 Inscrições Encerradas",
      shadow: "",
    },
    ongoing: {
      bg: "bg-blue-50 border-2 border-blue-400",
      text: "text-blue-800",
      dot: "bg-blue-600",
      label: "▶ Em Andamento",
      shadow: "",
    },
    completed: {
      bg: "bg-purple-50 border-2 border-purple-400",
      text: "text-purple-800",
      dot: "bg-purple-600",
      label: "✓ Finalizado",
      shadow: "",
    },
  };

  const style = config[status] ?? config.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${style.bg} ${style.text} ${style.shadow}`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

// ─── MODAL DE CONFIRMAÇÃO ─────────────────────────────────
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Confirmar Alteração
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────
const EditTournament = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTournamentById, updateTournament, tournaments } = useTournaments();
  const {
    teams,
    loading: teamsLoading,
    reload: refetchTeams,
    addTeam,
    updateTeam,
    deleteTeam,
  } = useTeams(id);
  const { groups, loading: groupsLoading } = useGroups(id);
  const [activeTab, setActiveTab] = useState<Tab>("torneio");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Estrutura editável
  const [estruturaCourts, setEstruturaCourts] = useState<string[]>([]);
  const [estruturaDuration, setEstruturaDuration] = useState("60");
  const [estruturaSchedules, setEstruturaSchedules] = useState<
    Array<{ date: string; startTime: string; endTime: string }>
  >([]);
  const [estruturaSaving, setEstruturaSaving] = useState(false);

  // Liga
  const [myLeagues, setMyLeagues] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [linkedLeague, setLinkedLeague] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [leagueLinking, setLeagueLinking] = useState(false);

  // Estados do modal de confirmação
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    field: string;
    value: any;
    title: string;
    message: string;
  }>({
    isOpen: false,
    field: "",
    value: null,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (id) {
      const tournamentData = getTournamentById(id);
      if (tournamentData) {
        setTournament(tournamentData);
        setEstruturaCourts((tournamentData as any).courts ?? []);
        setEstruturaDuration(
          String((tournamentData as any).matchDuration ?? 60),
        );
        setEstruturaSchedules(
          ((tournamentData as any).daySchedules ?? []).map((s: any) => ({
            date: s.date?.slice(0, 10) ?? s.date,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        );
      }
    }
    setLoading(false);
  }, [id, tournaments]);

  // Carrega ligas do clube + vínculo atual do torneio
  useEffect(() => {
    if (!id) return;
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
    const token = localStorage.getItem("auth_token") ?? "";
    const h = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    fetch(`${API_URL}/leagues`, { headers: h })
      .then((r) => r.json())
      .then(async (j) => {
        const all: Array<{ id: string; name: string }> = [
          ...(j.data?.created ?? []),
          ...(j.data?.member ?? []),
        ];
        setMyLeagues(all);
        // Detecta vínculo atual
        for (const league of all) {
          const detail = await fetch(`${API_URL}/leagues/${league.id}`, {
            headers: h,
          }).then((r) => r.json());
          const linked = (detail.data?.tournaments ?? []).find(
            (lt: any) => lt.tournamentId === id,
          );
          if (linked) {
            setLinkedLeague({ id: league.id, name: league.name });
            break;
          }
        }
      })
      .catch(console.error);
  }, [id]);

  const handleLinkLeague = async (leagueId: string) => {
    if (!id) return;
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
    const token = localStorage.getItem("auth_token") ?? "";
    setLeagueLinking(true);
    try {
      const res = await fetch(`${API_URL}/leagues/${leagueId}/tournaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tournamentId: id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erro ao vincular");
      const league = myLeagues.find((l) => l.id === leagueId);
      if (league) setLinkedLeague({ id: league.id, name: league.name });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLeagueLinking(false);
    }
  };

  const handleUnlinkLeague = async () => {
    if (!id || !linkedLeague) return;
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
    const token = localStorage.getItem("auth_token") ?? "";
    setLeagueLinking(true);
    try {
      const res = await fetch(
        `${API_URL}/leagues/${linkedLeague.id}/tournaments/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erro ao desvincular");
      setLinkedLeague(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLeagueLinking(false);
    }
  };

  const handleFieldChange = (
    field: keyof Tournament,
    value: any,
    fieldLabel: string,
  ) => {
    setConfirmModal({
      isOpen: true,
      field: field,
      value: value,
      title: "Confirmar Alteração",
      message: `Tem certeza que deseja alterar ${fieldLabel}? Esta alteração pode impactar inscritos e configurações existentes.`,
    });
  };

  // Verifica se há mudanças na estrutura
  const estruturaHasChanges = useMemo(() => {
    if (!tournament) return false;
    const origCourts = (tournament as any).courts ?? [];
    const origDuration = String((tournament as any).matchDuration ?? 60);
    const origSchedules = JSON.stringify(
      ((tournament as any).daySchedules ?? []).map((s: any) => ({
        date: s.date?.slice(0, 10) ?? s.date,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    );
    return (
      JSON.stringify(estruturaCourts) !== JSON.stringify(origCourts) ||
      estruturaDuration !== origDuration ||
      JSON.stringify(estruturaSchedules) !== origSchedules
    );
  }, [tournament, estruturaCourts, estruturaDuration, estruturaSchedules]);

  // Grupos gerados = bloquear edição de estrutura
  const groupsGenerated = !groupsLoading && groups.length > 0;

  // Capacidade em tempo real baseada nos campos da aba Estrutura
  const estruturaCapacity = useMemo(
    () =>
      calculateCapacity(
        estruturaCourts,
        estruturaSchedules,
        parseInt(estruturaDuration) || 60,
      ),
    [estruturaCourts, estruturaSchedules, estruturaDuration],
  );

  const handleSaveEstrutura = async () => {
    if (!tournament || !estruturaHasChanges || groupsGenerated) return;
    setEstruturaSaving(true);
    try {
      await updateTournament(tournament.id, {
        courts: estruturaCourts as any,
        matchDuration: parseInt(estruturaDuration) || (60 as any),
        daySchedules: estruturaSchedules as any,
      });
    } catch (e) {
      console.error("Erro ao salvar estrutura:", e);
    } finally {
      setEstruturaSaving(false);
    }
  };

  const capacity = useMemo(() => {
    if (!tournament) return null;
    const courts = (tournament as any).courts ?? [];
    const daySchedules = (tournament as any).daySchedules ?? [];
    const matchDuration = (tournament as any).matchDuration ?? 60;
    return calculateCapacity(courts, daySchedules, matchDuration);
  }, [tournament]);

  const confirmedCount = useMemo(
    () => teams.filter((t) => t.status === "confirmed").length,
    [teams],
  );

  const confirmFieldChange = () => {
    if (tournament && confirmModal.field) {
      const updated = {
        ...tournament,
        [confirmModal.field]: confirmModal.value,
      };
      setTournament(updated);
      updateTournament(tournament.id, {
        [confirmModal.field]: confirmModal.value,
      });
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleStatusChange = (
    newStatus:
      | "draft"
      | "published"
      | "open"
      | "closed"
      | "ongoing"
      | "completed",
  ) => {
    if (tournament) {
      updateTournament(tournament.id, {
        status: newStatus.toUpperCase() as any,
      });
    }
  };

  // ── CATEGORIAS ──────────────────────────────────────────
  const handleAddCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (tournament?.categories.includes(trimmed)) {
      alert("Essa categoria já existe.");
      return;
    }
    if (tournament) {
      const updated = {
        ...tournament,
        categories: [...tournament.categories, trimmed],
      };
      setTournament(updated);
      updateTournament(tournament.id, { categories: updated.categories });
    }
    setNewCategoryName("");
    setIsAddCategoryModalOpen(false);
  };

  const handleDeleteCategory = (cat: string) => {
    const count = teams.filter((t) => t.category === cat).length;
    if (
      count > 0 &&
      !window.confirm(
        `"${cat}" possui ${count} dupla(s) inscrita(s). Deseja excluir mesmo assim?`,
      )
    )
      return;
    if (tournament) {
      const updated = {
        ...tournament,
        categories: tournament.categories.filter((c) => c !== cat),
      };
      setTournament(updated);
      updateTournament(tournament.id, { categories: updated.categories });
    }
  };

  if (loading || teamsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando torneio...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Torneio não encontrado
          </h2>
          <p className="text-gray-600 mb-6">
            O torneio que você está procurando não existe ou foi removido.
          </p>
          <button
            onClick={() => navigate("/dashboard/tournaments")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Voltar para Meus Torneios
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      key: "torneio",
      label: "Torneio",
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      key: "estrutura",
      label: "Estrutura",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    },
    {
      key: "inscricoes",
      label: "Inscrições",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      key: "categorias",
      label: "Categorias",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
      key: "financeiro",
      label: "Financeiro",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      key: "grupos",
      label: "Grupos",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      key: "jogos",
      label: "Jogos",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      key: "playoffs",
      label: "Playoffs",
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader activePage="tournaments" />

      <main className="pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => navigate("/dashboard/tournaments")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
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
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {tournament.name}
                  </h1>
                  <p className="text-gray-600">
                    Gerencie todas as informações do torneio
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={tournament.status} />

                {tournament.status === "draft" && (
                  <button
                    onClick={() => handleStatusChange("published")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                  >
                    Publicar Torneio →
                  </button>
                )}
                {tournament.status === "published" && (
                  <>
                    <button
                      onClick={() => handleStatusChange("open")}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 shadow-lg transition-all whitespace-nowrap"
                    >
                      Abrir Inscrições
                    </button>
                    <button
                      onClick={() => handleStatusChange("draft")}
                      className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all whitespace-nowrap"
                    >
                      Voltar p/ Rascunho
                    </button>
                  </>
                )}
                {tournament.status === "open" && (
                  <button
                    onClick={() => handleStatusChange("closed")}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 shadow-lg transition-all whitespace-nowrap"
                  >
                    Encerrar Inscrições
                  </button>
                )}
                {tournament.status === "closed" && (
                  <button
                    onClick={() => handleStatusChange("open")}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 shadow-lg transition-all whitespace-nowrap"
                  >
                    Reabrir Inscrições
                  </button>
                )}
                {tournament.status === "ongoing" && (
                  <button
                    onClick={() => handleStatusChange("completed")}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-lg transition-all whitespace-nowrap"
                  >
                    Finalizar Torneio
                  </button>
                )}
                {tournament.status === "completed" && (
                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/tournaments/${tournament.id}/results`,
                      )
                    }
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 shadow-lg transition-all whitespace-nowrap"
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
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Resultados PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-x-auto">
            <div className="flex border-b border-gray-200 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as Tab)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors relative ${activeTab === tab.key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
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
                      d={tab.icon}
                    />
                  </svg>
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TAB CONTENT - Torneio (Geral + Estrutura) */}
          {activeTab === "torneio" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COLUNA ESQUERDA — 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações Básicas */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Nome do Torneio
                      </label>
                      <input
                        type="text"
                        value={tournament.name}
                        onChange={(e) =>
                          handleFieldChange(
                            "name",
                            e.target.value,
                            "o nome do torneio",
                          )
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        placeholder="Clique para alterar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Esporte
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                        {tournament.sport}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Clube Sede
                      </label>
                      <input
                        type="text"
                        value={tournament.clubSede || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "clubSede",
                            e.target.value,
                            "o clube sede",
                          )
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        placeholder="Clique para alterar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Data de Início
                      </label>
                      <input
                        type="date"
                        value={tournament.startDate?.slice(0, 10) ?? ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "startDate",
                            e.target.value,
                            "a data de início",
                          )
                        }
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Data de Término
                      </label>
                      <input
                        type="date"
                        value={tournament.endDate?.slice(0, 10) ?? ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "endDate",
                            e.target.value,
                            "a data de término",
                          )
                        }
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
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
                      Alterações em campos críticos exigem confirmação
                    </p>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA — 1/3 */}
              <div className="space-y-6">
                {/* Estrutura */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3">
                    Estrutura
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Quadras
                      </p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {((tournament as any).courts ?? []).length > 0
                          ? `${((tournament as any).courts ?? []).length} quadra${((tournament as any).courts ?? []).length !== 1 ? "s" : ""}`
                          : "—"}
                      </p>
                      {((tournament as any).courts ?? []).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {((tournament as any).courts ?? []).join(", ")}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Duração por Jogo
                      </p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {(tournament as any).matchDuration ?? 60} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Horários
                      </p>
                      {((tournament as any).daySchedules ?? []).length > 0 ? (
                        <div className="space-y-1">
                          {((tournament as any).daySchedules ?? []).map(
                            (s: any, i: number) => (
                              <div key={i} className="text-xs text-gray-600">
                                <span className="text-gray-400">
                                  {new Date(
                                    s.date.slice(0, 10) + "T12:00:00",
                                  ).toLocaleDateString("pt-BR")}
                                </span>{" "}
                                {s.startTime}–{s.endTime}
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-blue-500 mt-4">
                    Para alterar, recrie o torneio.
                  </p>
                </div>

                {/* Capacidade */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3">
                    Capacidade
                  </h3>
                  {capacity ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                          <div className="text-2xl font-black text-blue-700">
                            {capacity.maxTeams}
                          </div>
                          <div className="text-xs text-blue-500 mt-0.5">
                            Duplas máx.
                          </div>
                        </div>
                        <div
                          className={`border rounded-lg p-3 text-center ${confirmedCount > capacity.maxTeams ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}
                        >
                          <div
                            className={`text-2xl font-black ${confirmedCount > capacity.maxTeams ? "text-red-600" : "text-gray-700"}`}
                          >
                            {confirmedCount}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Confirmadas
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                          <div className="text-2xl font-black text-gray-700">
                            {capacity.slotsAvailable}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Slots totais
                          </div>
                        </div>
                        <div
                          className={`border rounded-lg p-3 text-center ${capacity.maxTeams - confirmedCount < 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}
                        >
                          <div
                            className={`text-2xl font-black ${capacity.maxTeams - confirmedCount < 0 ? "text-red-600" : "text-gray-700"}`}
                          >
                            {capacity.maxTeams - confirmedCount}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Vagas livres
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${confirmedCount > capacity.maxTeams ? "bg-red-500" : "bg-blue-500"}`}
                          style={{
                            width: `${Math.min((confirmedCount / capacity.maxTeams) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      {confirmedCount > capacity.maxTeams && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          ⚠️ {confirmedCount - capacity.maxTeams} dupla
                          {confirmedCount - capacity.maxTeams !== 1
                            ? "s"
                            : ""}{" "}
                          a mais que a estrutura comporta.
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Sem dados suficientes.
                    </p>
                  )}
                </div>

                {/* Limite */}
                {tournament && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      Limite de Inscrições
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-black text-gray-900">
                        {(tournament as any).maxTeams >= 999
                          ? "Sem limite"
                          : `${(tournament as any).maxTeams} duplas`}
                      </span>
                      {capacity && (tournament as any).maxTeams >= 999 && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                          Rec.: {capacity.maxTeams} duplas
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Liga */}
                {tournament &&
                  ["draft", "published"].includes(
                    tournament.status?.toLowerCase() ?? "",
                  ) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-gray-900">
                          Liga
                        </h3>
                        {linkedLeague && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                            Vinculada
                          </span>
                        )}
                      </div>
                      {linkedLeague ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-lg">🏆</span>
                            <span className="text-sm font-semibold text-blue-800 flex-1 truncate">
                              {linkedLeague.name}
                            </span>
                          </div>
                          <button
                            onClick={handleUnlinkLeague}
                            disabled={leagueLinking}
                            className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            {leagueLinking
                              ? "Removendo..."
                              : "Desvincular liga"}
                          </button>
                        </div>
                      ) : myLeagues.length === 0 ? (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-400 mb-2">
                            Você não participa de nenhuma liga ainda.
                          </p>
                          <a
                            href="/dashboard/leagues"
                            className="text-xs text-blue-600 hover:underline font-semibold"
                          >
                            Criar ou entrar em uma liga →
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 mb-2">
                            Torneio avulso. Vincule a uma liga para distribuir
                            pontos.
                          </p>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value)
                                handleLinkLeague(e.target.value);
                            }}
                            disabled={leagueLinking}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:opacity-50 transition-colors"
                          >
                            <option value="">Selecionar liga...</option>
                            {myLeagues.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                {/* Liga — read-only após OPEN */}
                {tournament &&
                  !["draft", "published"].includes(
                    tournament.status?.toLowerCase() ?? "",
                  ) &&
                  linkedLeague && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        Liga
                      </h3>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-lg">🏆</span>
                        <span className="text-sm font-semibold text-blue-800 flex-1 truncate">
                          {linkedLeague.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Liga não pode ser alterada após as inscrições abrirem.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
          {/* TAB CONTENT - Estrutura */}
          {activeTab === "estrutura" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COLUNA 1 — Quadras */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  Quadras
                </h3>
                {groupsGenerated && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    🔒 Grupos gerados — estrutura bloqueada
                  </div>
                )}
                <button
                  onClick={() =>
                    setEstruturaCourts((prev) => [
                      ...prev,
                      `Quadra ${prev.length + 1}`,
                    ])
                  }
                  disabled={groupsGenerated}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Adicionar Quadra
                </button>
                {estruturaCourts.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    Nenhuma quadra adicionada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {estruturaCourts.map((court, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={court}
                          disabled={groupsGenerated}
                          onChange={(e) => {
                            const updated = [...estruturaCourts];
                            updated[idx] = e.target.value;
                            setEstruturaCourts(updated);
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        <button
                          onClick={() =>
                            setEstruturaCourts((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          disabled={groupsGenerated}
                          className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-400 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COLUNA 2 — Duração + Horários */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Tempo por Partida
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={estruturaDuration}
                      disabled={groupsGenerated}
                      onChange={(e) => setEstruturaDuration(e.target.value)}
                      className="w-28 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <span className="text-sm text-gray-500">minutos</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Horários por Dia
                  </h3>
                  {estruturaSchedules.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Sem horários configurados
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {estruturaSchedules.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            {new Date(s.date + "T12:00:00").toLocaleDateString(
                              "pt-BR",
                              {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                              },
                            )}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="time"
                              value={s.startTime}
                              disabled={groupsGenerated}
                              onChange={(e) => {
                                const updated = [...estruturaSchedules];
                                updated[idx] = {
                                  ...updated[idx],
                                  startTime: e.target.value,
                                };
                                setEstruturaSchedules(updated);
                              }}
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                            />
                            <span className="text-gray-400 text-sm">até</span>
                            <input
                              type="time"
                              value={s.endTime}
                              disabled={groupsGenerated}
                              onChange={(e) => {
                                const updated = [...estruturaSchedules];
                                updated[idx] = {
                                  ...updated[idx],
                                  endTime: e.target.value,
                                };
                                setEstruturaSchedules(updated);
                              }}
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA 3 — Resumo + Guardar */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Resumo
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quadras</span>
                      <span className="font-semibold text-gray-900">
                        {estruturaCourts.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duração/jogo</span>
                      <span className="font-semibold text-gray-900">
                        {estruturaDuration || "—"} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dias</span>
                      <span className="font-semibold text-gray-900">
                        {estruturaSchedules.length}
                      </span>
                    </div>
                  </div>

                  {estruturaCapacity && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">
                        Capacidade estimada
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-blue-600">
                          {estruturaCapacity.maxTeams}
                        </span>
                        <span className="text-sm text-gray-500">duplas</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {estruturaCapacity.slotsAvailable} slots totais
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveEstrutura}
                  disabled={
                    !estruturaHasChanges || groupsGenerated || estruturaSaving
                  }
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {estruturaSaving
                    ? "A guardar..."
                    : groupsGenerated
                      ? "🔒 Bloqueado (grupos gerados)"
                      : "Guardar Estrutura"}
                </button>

                {!estruturaHasChanges && !groupsGenerated && (
                  <p className="text-xs text-center text-gray-400">
                    Sem alterações pendentes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT - Inscrições */}
          {activeTab === "inscricoes" && (
            <TabInscricoes
              tournament={tournament}
              teams={teams}
              addTeam={addTeam}
              updateTeam={updateTeam}
              deleteTeam={deleteTeam}
            />
          )}
          {/* TAB CONTENT - Categorias */}
          {activeTab === "categorias" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Categorias do Torneio
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {tournament.categories?.length || 0} categoria
                    {(tournament.categories?.length || 0) !== 1 ? "s" : ""}{" "}
                    cadastrada
                    {(tournament.categories?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Adicionar Categoria
                </button>
              </div>
              {tournament.categories && tournament.categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournament.categories.map((cat, idx) => {
                    const totalInCat = teams.filter(
                      (t) => t.category === cat,
                    ).length;
                    const confirmedInCat = teams.filter(
                      (t) => t.category === cat && t.status === "confirmed",
                    ).length;
                    const pendingInCat = teams.filter(
                      (t) => t.category === cat && t.status === "pending",
                    ).length;
                    const colors = [
                      {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        accent: "bg-blue-600",
                        text: "text-blue-700",
                      },
                      {
                        bg: "bg-purple-50",
                        border: "border-purple-200",
                        accent: "bg-purple-600",
                        text: "text-purple-700",
                      },
                      {
                        bg: "bg-emerald-50",
                        border: "border-emerald-200",
                        accent: "bg-emerald-600",
                        text: "text-emerald-700",
                      },
                      {
                        bg: "bg-amber-50",
                        border: "border-amber-200",
                        accent: "bg-amber-500",
                        text: "text-amber-700",
                      },
                      {
                        bg: "bg-rose-50",
                        border: "border-rose-200",
                        accent: "bg-rose-600",
                        text: "text-rose-700",
                      },
                      {
                        bg: "bg-cyan-50",
                        border: "border-cyan-200",
                        accent: "bg-cyan-600",
                        text: "text-cyan-700",
                      },
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <div
                        key={idx}
                        className={`relative ${color.bg} border-2 ${color.border} rounded-xl p-5 hover:shadow-md transition-all group overflow-hidden`}
                      >
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 ${color.accent}`}
                        />
                        <div className="flex items-start justify-between mt-1">
                          <h4
                            className={`text-xl font-bold ${color.text} truncate flex-1 min-w-0 mr-2`}
                          >
                            {cat}
                          </h4>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-4 mb-3 flex items-end gap-1.5">
                          <span className={`text-4xl font-black ${color.text}`}>
                            {totalInCat}
                          </span>
                          <span className="text-sm text-gray-500 mb-1 font-medium">
                            dupla{totalInCat !== 1 ? "s" : ""} inscrita
                            {totalInCat !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {confirmedInCat > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {confirmedInCat} confirmada
                              {confirmedInCat !== 1 ? "s" : ""}
                            </span>
                          )}
                          {pendingInCat > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {pendingInCat} pendente
                              {pendingInCat !== 1 ? "s" : ""}
                            </span>
                          )}
                          {totalInCat === 0 && (
                            <span className="text-xs text-gray-400 font-medium">
                              Nenhuma inscrição
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-7 h-7 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-semibold mb-1">
                    Nenhuma categoria cadastrada
                  </p>
                  <p className="text-gray-400 text-sm mb-5">
                    Adicione categorias para organizar as inscrições
                  </p>
                  <button
                    onClick={() => setIsAddCategoryModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all"
                  >
                    + Adicionar Primeira Categoria
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT - Financeiro */}
          {activeTab === "financeiro" && (
            <TabFinanceiro
              tournamentId={tournament.id}
              priceFirstCategory={tournament.priceFirstCategory}
              pixKey={tournament.pixKey || ""}
              priceSecondCategory={tournament.priceSecondCategory || 0}
              onFieldChange={handleFieldChange}
            />
          )}

          {/* TAB CONTENT - Grupos */}
          {activeTab === "grupos" && (
            <TabGrupos teams={teams} tournament={tournament} />
          )}

          {/* TAB CONTENT - Jogos */}
          {activeTab === "jogos" && (
            <TabJogos teams={teams} tournament={tournament} />
          )}

          {/* TAB CONTENT - Playoffs */}
          {activeTab === "playoffs" && (
            <TabPlayoffs tournament={tournament} teams={teams} />
          )}
        </div>
      </main>

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmFieldChange}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      {/* Modal Adicionar Categoria */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsAddCategoryModalOpen(false);
              setNewCategoryName("");
            }}
          />
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">
                Adicionar Categoria
              </h3>
              <button
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setNewCategoryName("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {(() => {
              const predefined = [
                "Open Masculina",
                "Open Feminina",
                "Open Mista",
                "1ª Masc",
                "2ª Masc",
                "3ª Masc",
                "4ª Masc",
                "5ª Masc",
                "6ª Masc",
                "7ª Masc",
                "1ª Fem",
                "2ª Fem",
                "3ª Fem",
                "4ª Fem",
                "5ª Fem",
                "6ª Fem",
                "7ª Fem",
                "1ª Mista",
                "2ª Mista",
                "3ª Mista",
                "4ª Mista",
                "5ª Mista",
                "Sub-18 Masc",
                "Sub-18 Fem",
                "Master 40+",
                "Master 45+",
                "Master 50+",
              ];
              const available = predefined.filter(
                (p) => !tournament?.categories.includes(p),
              );
              if (!available.length) return null;
              return (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Categorias pré-definidas
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                    {available.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleAddCategory(cat)}
                        className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        + {cat}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 font-medium">
                ou crie uma nova
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAddCategory(newCategoryName)
                }
                placeholder="Ex: Master 35+, Misto B..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                autoFocus
              />
              <button
                onClick={() => handleAddCategory(newCategoryName)}
                disabled={!newCategoryName.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditTournament;
