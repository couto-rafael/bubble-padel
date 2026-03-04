import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import { useTournaments, useTeams } from "./hooks";
import type { Tournament, Group } from "./types";
import TabGrupos from "./TabGrupos";
import TabJogos from "./TabJogos";

// ─── TIPOS ────────────────────────────────────────────────
type Tab =
  | "geral"
  | "inscricoes"
  | "categorias"
  | "financeiro"
  | "grupos"
  | "jogos"
  | "configuracoes";

// ─── STATUS BADGE ─────────────────────────────────────────
const StatusBadge = ({
  status,
}: {
  status: "draft" | "published" | "ongoing" | "completed";
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

  const style = config[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-extrabold ${style.bg} ${style.text} ${style.shadow}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${style.dot} animate-pulse`} />
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
  const [sharedGroups, setSharedGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("geral");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [paymentFilter, setPaymentFilter] = useState("todos");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  }>({ top: 0, right: 0 });
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateConfig, setGenerateConfig] = useState({
    quantity: 4,
    category: "",
  });
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTeam, setNewTeam] = useState({
    athlete1Name: "",
    athlete1Email: "",
    athlete2Name: "",
    athlete2Email: "",
    category: "",
  });

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
      }
    }
    setLoading(false);
  }, [id, getTournamentById, tournaments]);

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
    newStatus: "draft" | "published" | "ongoing" | "completed",
  ) => {
    if (tournament) {
      const updated = { ...tournament, status: newStatus };
      setTournament(updated);
      updateTournament(tournament.id, { status: newStatus });
    }
  };

  const handleAddTeam = async () => {
    if (
      !newTeam.athlete1Name ||
      !newTeam.athlete1Email ||
      !newTeam.athlete2Name ||
      !newTeam.athlete2Email ||
      !newTeam.category
    ) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    try {
      await addTeam({
        player1Name: newTeam.athlete1Name,
        player1Email: newTeam.athlete1Email,
        player2Name: newTeam.athlete2Name,
        player2Email: newTeam.athlete2Email,
        category: newTeam.category,
      });
      setIsAddTeamModalOpen(false);
      setNewTeam({
        athlete1Name: "",
        athlete1Email: "",
        athlete2Name: "",
        athlete2Email: "",
        category: "",
      });
    } catch {
      alert("Erro ao adicionar dupla. Tente novamente.");
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

  // ── GERAR DUPLAS ALEATÓRIAS (TESTE) ─────────────────────
  const RANDOM_FIRST = [
    "Lucas",
    "Pedro",
    "Rafael",
    "Bruno",
    "Felipe",
    "Thiago",
    "Gabriel",
    "Matheus",
    "André",
    "Diego",
    "Carlos",
    "Henrique",
    "Vinícius",
    "Eduardo",
    "Rodrigo",
    "Ana",
    "Maria",
    "Juliana",
    "Fernanda",
    "Camila",
    "Beatriz",
    "Larissa",
    "Letícia",
    "Amanda",
    "Vanessa",
  ];
  const RANDOM_LAST = [
    "Silva",
    "Santos",
    "Oliveira",
    "Souza",
    "Lima",
    "Costa",
    "Ferreira",
    "Alves",
    "Pereira",
    "Carvalho",
    "Rodrigues",
    "Martins",
    "Araújo",
    "Gomes",
    "Ribeiro",
  ];
  const rName = () =>
    `${RANDOM_FIRST[Math.floor(Math.random() * RANDOM_FIRST.length)]} ${RANDOM_LAST[Math.floor(Math.random() * RANDOM_LAST.length)]}`;
  const rEmail = (n: string) => {
    const c = n
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".");
    return `${c}${Math.floor(Math.random() * 99)}@${["gmail.com", "hotmail.com", "email.com"][Math.floor(Math.random() * 3)]}`;
  };

  const handleGenerateTeams = async () => {
    if (!generateConfig.category) {
      alert("Selecione uma categoria");
      return;
    }
    try {
      for (let i = 0; i < generateConfig.quantity; i++) {
        const p1 = rName();
        const p2 = rName();
        await addTeam({
          player1Name: p1,
          player1Email: rEmail(p1),
          player2Name: p2,
          player2Email: rEmail(p2),
          category: generateConfig.category,
        });
      }
    } catch {
      alert("Erro ao gerar duplas.");
    }
    setIsGenerateModalOpen(false);
    setGenerateConfig({ quantity: 4, category: "" });
  };

  const tabs = [
    {
      key: "geral",
      label: "Informações Gerais",
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
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
      key: "configuracoes",
      label: "Configurações",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    },
  ];

  // Filtrar inscritos
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.player1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.player2Name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "todas" || team.category === categoryFilter;
    const matchesStatus =
      statusFilter === "todos" || team.status === statusFilter;
    const matchesPayment =
      paymentFilter === "todos" || team.paymentStatus === paymentFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesPayment;
  });
  const hasActiveFilters =
    categoryFilter !== "todas" ||
    statusFilter !== "todos" ||
    paymentFilter !== "todos" ||
    searchQuery !== "";

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
                      onClick={() => handleStatusChange("ongoing")}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 shadow-lg transition-all whitespace-nowrap"
                    >
                      Iniciar Torneio
                    </button>
                    <button
                      onClick={() => handleStatusChange("draft")}
                      className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all whitespace-nowrap"
                    >
                      Voltar p/ Rascunho
                    </button>
                  </>
                )}
                {tournament.status === "ongoing" && (
                  <button
                    onClick={() => handleStatusChange("completed")}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-lg transition-all whitespace-nowrap"
                  >
                    Finalizar Torneio
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

          {/* TAB CONTENT - Geral */}
          {activeTab === "geral" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
                    <select
                      value={tournament.sport}
                      onChange={(e) =>
                        handleFieldChange("sport", e.target.value, "o esporte")
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <option>Padel</option>
                      <option>Beach Tennis</option>
                      <option>Tenis</option>
                      <option>Pickleball</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={tournament.startDate}
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
                      value={tournament.endDate}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Início das Inscrições
                    </label>
                    <input
                      type="date"
                      value={tournament.registrationStartDate}
                      onChange={(e) =>
                        handleFieldChange(
                          "registrationStartDate",
                          e.target.value,
                          "o início das inscrições",
                        )
                      }
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Fim das Inscrições
                    </label>
                    <input
                      type="date"
                      value={tournament.registrationEndDate}
                      onChange={(e) =>
                        handleFieldChange(
                          "registrationEndDate",
                          e.target.value,
                          "o fim das inscrições",
                        )
                      }
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
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
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
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
          )}

          {/* TAB CONTENT - Inscrições */}
          {activeTab === "inscricoes" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Buscar por Nome
                    </label>
                    <div className="relative">
                      <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Digite o nome de um jogador..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-44">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Categoria
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="todas">Todas</option>
                      {tournament.categories.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-40">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="todos">Todos</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="pending">Aguardando</option>
                    </select>
                  </div>
                  <div className="w-full md:w-40">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Pagamento
                    </label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="todos">Todos</option>
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setIsAddTeamModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 shadow-sm hover:shadow transition-all whitespace-nowrap"
                  >
                    + Adicionar Dupla
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {hasActiveFilters ? (
                        <>
                          <span className="font-bold text-blue-600 text-base">
                            {filteredTeams.length}
                          </span>
                          <span className="text-gray-400"> de </span>
                          <span className="font-semibold text-gray-700">
                            {teams.length}
                          </span>
                          <span>
                            {" "}
                            dupla{teams.length !== 1 ? "s" : ""} exibida
                            {filteredTeams.length !== 1 ? "s" : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-gray-800 text-base">
                            {teams.length}
                          </span>
                          <span>
                            {" "}
                            dupla{teams.length !== 1 ? "s" : ""} inscrita
                            {teams.length !== 1 ? "s" : ""} no total
                          </span>
                        </>
                      )}
                    </span>
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter("todas");
                          setStatusFilter("todos");
                          setPaymentFilter("todos");
                        }}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Limpar filtros
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold text-sm hover:bg-amber-600 shadow-sm transition-all whitespace-nowrap flex items-center gap-2"
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Gerar Duplas{" "}
                    <span className="text-xs bg-amber-700/40 px-1.5 py-0.5 rounded font-medium">
                      TESTE
                    </span>
                  </button>
                </div>
              </div>

              {/* Lista de Inscritos */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Atleta 1
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Atleta 2
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Data Inscrição
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Pagamento
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Restrição
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTeams.map((team) => (
                        <tr
                          key={team.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">
                                {team.player1Name}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {team.player1Email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">
                                {team.player2Name}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {team.player2Email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                              {team.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(team.registrationDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {team.status === "confirmed" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Confirmada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Aguardando Confirmação
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {team.paymentStatus === "paid" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pago
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Aguardando Pgto.
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {team.hasRestriction ? (
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <button
                                onClick={(e) => {
                                  const rect = (
                                    e.currentTarget as HTMLElement
                                  ).getBoundingClientRect();
                                  const flip =
                                    window.innerHeight - rect.bottom < 160;
                                  setMenuPosition({
                                    top: flip
                                      ? rect.top - 160
                                      : rect.bottom + 4,
                                    right: window.innerWidth - rect.right,
                                  });
                                  setOpenMenuId(
                                    openMenuId === team.id ? null : team.id,
                                  );
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-gray-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                  />
                                </svg>
                              </button>

                              {openMenuId === team.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  ></div>
                                  <div
                                    className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                                    style={{
                                      top: menuPosition.top,
                                      right: menuPosition.right,
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      Editar Dupla
                                    </button>

                                    {team.status === "pending" && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            await updateTeam(team.id, {
                                              status: "confirmed",
                                            });
                                          } catch {
                                            alert("Erro ao confirmar dupla.");
                                          }
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
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
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Confirmar
                                      </button>
                                    )}

                                    <div className="border-t border-gray-200 my-2"></div>

                                    <button
                                      onClick={async () => {
                                        if (
                                          window.confirm(
                                            "Deseja realmente excluir esta dupla?",
                                          )
                                        ) {
                                          try {
                                            await deleteTeam(team.id);
                                          } catch {
                                            alert("Erro ao excluir dupla.");
                                          }
                                        }
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      Excluir
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredTeams.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Nenhuma inscrição encontrada
                    </p>
                  </div>
                )}
              </div>
            </div>
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
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Configurações Financeiras
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Preço 1ª Categoria
                  </label>
                  <input
                    type="number"
                    value={tournament.priceFirstCategory}
                    onChange={(e) =>
                      handleFieldChange(
                        "priceFirstCategory",
                        parseFloat(e.target.value),
                        "o preço da 1ª categoria",
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Preço 2ª+ Categoria
                  </label>
                  <input
                    type="number"
                    value={tournament.priceSecondCategory || 0}
                    onChange={(e) =>
                      handleFieldChange(
                        "priceSecondCategory",
                        parseFloat(e.target.value),
                        "o preço da 2ª+ categoria",
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={tournament.pixKey || ""}
                    onChange={(e) =>
                      handleFieldChange("pixKey", e.target.value, "a chave PIX")
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    placeholder="Clique para alterar"
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
                  Alterações financeiras exigem confirmação
                </p>
              </div>
            </div>
          )}

          {/* TAB CONTENT - Grupos */}
          {activeTab === "grupos" && (
            <TabGrupos
              teams={teams}
              tournament={tournament}
              onGroupsChange={setSharedGroups}
            />
          )}

          {/* TAB CONTENT - Jogos */}
          {activeTab === "jogos" && (
            <TabJogos
              teams={teams}
              tournament={tournament}
              groups={sharedGroups}
            />
          )}

          {/* TAB CONTENT - Configurações */}
          {activeTab === "configuracoes" && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Configurações Avançadas
              </h3>
              <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Adicionar Dupla */}
      {isAddTeamModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsAddTeamModalOpen(false);
              setNewTeam({
                athlete1Name: "",
                athlete1Email: "",
                athlete2Name: "",
                athlete2Email: "",
                category: "",
              });
            }}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Adicionar Nova Dupla
              </h3>
              <button
                onClick={() => {
                  setIsAddTeamModalOpen(false);
                  setNewTeam({
                    athlete1Name: "",
                    athlete1Email: "",
                    athlete2Name: "",
                    athlete2Email: "",
                    category: "",
                  });
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

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Atleta 1
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={newTeam.athlete1Name}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, athlete1Name: e.target.value })
                      }
                      placeholder="Ex: João Silva"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newTeam.athlete1Email}
                      onChange={(e) =>
                        setNewTeam({
                          ...newTeam,
                          athlete1Email: e.target.value,
                        })
                      }
                      placeholder="joao@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Atleta 2
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={newTeam.athlete2Name}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, athlete2Name: e.target.value })
                      }
                      placeholder="Ex: Pedro Santos"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newTeam.athlete2Email}
                      onChange={(e) =>
                        setNewTeam({
                          ...newTeam,
                          athlete2Email: e.target.value,
                        })
                      }
                      placeholder="pedro@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Categoria
                </label>
                <select
                  value={newTeam.category}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="">Selecione uma categoria</option>
                  {tournament?.categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddTeamModalOpen(false);
                  setNewTeam({
                    athlete1Name: "",
                    athlete1Email: "",
                    athlete2Name: "",
                    athlete2Email: "",
                    category: "",
                  });
                }}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTeam}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Adicionar Dupla
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal Gerar Duplas (TESTE) */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsGenerateModalOpen(false)}
          />
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">
                  Gerar Duplas
                </h3>
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">
                  TESTE
                </span>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
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
            <p className="text-sm text-gray-500 mb-6">
              Gera duplas com nomes aleatórios para fins de teste.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Duplas
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setGenerateConfig((c) => ({
                        ...c,
                        quantity: Math.max(1, c.quantity - 1),
                      }))
                    }
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 font-bold text-lg"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={generateConfig.quantity}
                    onChange={(e) =>
                      setGenerateConfig((c) => ({
                        ...c,
                        quantity: Math.max(
                          1,
                          Math.min(64, Number(e.target.value)),
                        ),
                      }))
                    }
                    className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-900 font-semibold text-lg"
                  />
                  <button
                    onClick={() =>
                      setGenerateConfig((c) => ({
                        ...c,
                        quantity: Math.min(64, c.quantity + 1),
                      }))
                    }
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 font-bold text-lg"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500">
                    duplas (máx. 64)
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={generateConfig.category}
                  onChange={(e) =>
                    setGenerateConfig((c) => ({
                      ...c,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-gray-900"
                >
                  <option value="">Selecione uma categoria</option>
                  {tournament?.categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {generateConfig.category && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                Serão geradas <strong>{generateConfig.quantity} duplas</strong>{" "}
                na categoria <strong>{generateConfig.category}</strong>.
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateTeams}
                className="px-5 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center gap-2"
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Gerar {generateConfig.quantity} Dupla
                {generateConfig.quantity !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditTournament;
