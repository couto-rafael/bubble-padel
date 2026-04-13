import { useState } from "react";
import type { Team } from "../types";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Tournament {
  id: string;
  categories: string[];
  status: string;
}

interface Props {
  tournament: Tournament;
  teams: Team[];
  addTeam: (data: Partial<Team>) => Promise<any>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<any>;
  deleteTeam: (id: string) => Promise<any>;
  readOnly?: boolean;
}

// ─── RANDOM HELPERS (para geração de teste) ───────────────────────────────────

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
const rEmail = (n: string) =>
  `${n
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\s+/g,
      ".",
    )}${Math.floor(Math.random() * 99)}@${["gmail.com", "hotmail.com", "email.com"][Math.floor(Math.random() * 3)]}`;

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const TabInscricoes = ({
  tournament,
  teams,
  addTeam,
  updateTeam,
  deleteTeam,
  readOnly = false,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [paymentFilter, setPaymentFilter] = useState("todos");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Modais
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateConfig, setGenerateConfig] = useState({
    quantity: 4,
    category: "",
  });
  const [newTeam, setNewTeam] = useState({
    athlete1Name: "",
    athlete1Email: "",
    athlete2Name: "",
    athlete2Email: "",
    category: "",
  });

  // Bulk actions
  const [bulkLoading, setBulkLoading] = useState<"status" | "payment" | null>(
    null,
  );
  const [bulkDone, setBulkDone] = useState<"status" | "payment" | null>(null);

  // ── Filtros ──────────────────────────────────────────────────────────────────

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.player1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.player2Name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "todas" || t.category === categoryFilter;
    const matchesStatus = statusFilter === "todos" || t.status === statusFilter;
    const matchesPayment =
      paymentFilter === "todos" || t.paymentStatus === paymentFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesPayment;
  });

  const hasActiveFilters =
    categoryFilter !== "todas" ||
    statusFilter !== "todos" ||
    paymentFilter !== "todos" ||
    searchQuery !== "";

  const pendingCount = teams.filter((t) => t.status === "pending").length;
  const unpaidCount = teams.filter((t) => t.paymentStatus === "pending").length;

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("todas");
    setStatusFilter("todos");
    setPaymentFilter("todos");
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────────

  const handleConfirmAllStatus = async () => {
    if (
      !pendingCount ||
      !window.confirm(
        `Confirmar ${pendingCount} dupla${pendingCount !== 1 ? "s" : ""} pendente${pendingCount !== 1 ? "s" : ""}?`,
      )
    )
      return;
    setBulkLoading("status");
    try {
      await Promise.all(
        teams
          .filter((t) => t.status === "pending")
          .map((t) => updateTeam(t.id, { status: "confirmed" })),
      );
      setBulkDone("status");
      setTimeout(() => setBulkDone(null), 2500);
    } catch {
      alert("Erro ao confirmar duplas.");
    } finally {
      setBulkLoading(null);
    }
  };

  const handleConfirmAllPayment = async () => {
    if (
      !unpaidCount ||
      !window.confirm(
        `Confirmar pagamento de ${unpaidCount} dupla${unpaidCount !== 1 ? "s" : ""}?`,
      )
    )
      return;
    setBulkLoading("payment");
    try {
      await Promise.all(
        teams
          .filter((t) => t.paymentStatus === "pending")
          .map((t) => updateTeam(t.id, { paymentStatus: "paid" })),
      );
      setBulkDone("payment");
      setTimeout(() => setBulkDone(null), 2500);
    } catch {
      alert("Erro ao confirmar pagamentos.");
    } finally {
      setBulkLoading(null);
    }
  };

  // ── Add team ─────────────────────────────────────────────────────────────────

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

  // ── Generate teams (teste) ───────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── BULK ACTIONS ── */}
      {!readOnly && (pendingCount > 0 || unpaidCount > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <svg
            className="w-5 h-5 text-blue-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-blue-700 flex-1">
            {pendingCount > 0 && (
              <>
                <strong>{pendingCount}</strong> dupla
                {pendingCount !== 1 ? "s" : ""} aguardando confirmação.{" "}
              </>
            )}
            {unpaidCount > 0 && (
              <>
                <strong>{unpaidCount}</strong> pagamento
                {unpaidCount !== 1 ? "s" : ""} pendente
                {unpaidCount !== 1 ? "s" : ""}.
              </>
            )}
          </span>
          <div className="flex gap-2 flex-wrap">
            {pendingCount > 0 && (
              <button
                onClick={handleConfirmAllStatus}
                disabled={bulkLoading === "status"}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${bulkDone === "status" ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-emerald-600 hover:bg-emerald-700 text-white"} disabled:opacity-50`}
              >
                {bulkLoading === "status"
                  ? "Confirmando..."
                  : bulkDone === "status"
                    ? "✓ Confirmadas!"
                    : `Confirmar ${pendingCount} dupla${pendingCount !== 1 ? "s" : ""}`}
              </button>
            )}
            {unpaidCount > 0 && (
              <button
                onClick={handleConfirmAllPayment}
                disabled={bulkLoading === "payment"}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${bulkDone === "payment" ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"} disabled:opacity-50`}
              >
                {bulkLoading === "payment"
                  ? "Confirmando..."
                  : bulkDone === "payment"
                    ? "✓ Pagamentos confirmados!"
                    : `Confirmar ${unpaidCount} pagamento${unpaidCount !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FILTROS E AÇÕES ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Busca */}
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

          {/* Categoria */}
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

          {/* Status */}
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

          {/* Pagamento */}
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

          {!readOnly && (
            <button
              onClick={() => setIsAddTeamModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              + Adicionar Dupla
            </button>
          )}
        </div>

        {/* Contador + limpar + gerar */}
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
                  </span>{" "}
                  dupla{teams.length !== 1 ? "s" : ""} exibida
                  {filteredTeams.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <span className="font-bold text-gray-800 text-base">
                    {teams.length}
                  </span>{" "}
                  dupla{teams.length !== 1 ? "s" : ""} inscrita
                  {teams.length !== 1 ? "s" : ""} no total
                </>
              )}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
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

      {/* ── TABELA ── */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Atleta 1",
                  "Atleta 2",
                  "Categoria",
                  "Data Inscrição",
                  "Status",
                  "Pagamento",
                  "Restrição",
                  "Ações",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${h === "Restrição" || h === "Ações" ? "text-center" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTeams.map((team) => (
                <tr
                  key={team.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {team.player1Name}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {team.player1Email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {team.player2Name}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {team.player2Email}
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
                        Aguardando
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
                    <div className="flex justify-center relative">
                      {!readOnly && <button
                        onClick={(e) => {
                          const rect = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          const flip = window.innerHeight - rect.bottom < 160;
                          setMenuPosition({
                            top: flip ? rect.top - 160 : rect.bottom + 4,
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
                      </button>}

                      {!readOnly && openMenuId === team.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                            style={{
                              top: menuPosition.top,
                              right: menuPosition.right,
                            }}
                          >
                            <button
                              onClick={() => setOpenMenuId(null)}
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
                                Confirmar Dupla
                              </button>
                            )}

                            {team.paymentStatus === "pending" && (
                              <button
                                onClick={async () => {
                                  try {
                                    await updateTeam(team.id, {
                                      paymentStatus: "paid",
                                    });
                                  } catch {
                                    alert("Erro ao confirmar pagamento.");
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
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
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Confirmar Pagamento
                              </button>
                            )}

                            <div className="border-t border-gray-200 my-2" />

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
            <p className="text-gray-500">Nenhuma inscrição encontrada</p>
          </div>
        )}
      </div>

      {/* ── MODAL ADICIONAR DUPLA ── */}
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
          />
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
              {[
                {
                  label: "Atleta 1",
                  nameKey: "athlete1Name",
                  emailKey: "athlete1Email",
                  placeholder: "Ex: João Silva",
                },
                {
                  label: "Atleta 2",
                  nameKey: "athlete2Name",
                  emailKey: "athlete2Email",
                  placeholder: "Ex: Pedro Santos",
                },
              ].map(({ label, nameKey, emailKey, placeholder }) => (
                <div key={label}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {label}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={newTeam[nameKey as keyof typeof newTeam]}
                        onChange={(e) =>
                          setNewTeam({ ...newTeam, [nameKey]: e.target.value })
                        }
                        placeholder={placeholder}
                        autoComplete="off"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newTeam[emailKey as keyof typeof newTeam]}
                        onChange={(e) =>
                          setNewTeam({ ...newTeam, [emailKey]: e.target.value })
                        }
                        placeholder="email@exemplo.com"
                        autoComplete="off"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                  {tournament.categories.map((cat, idx) => (
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

      {/* ── MODAL GERAR DUPLAS (TESTE) ── */}
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
                  {tournament.categories.map((cat, idx) => (
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

export default TabInscricoes;
