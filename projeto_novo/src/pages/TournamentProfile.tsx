import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import { PaymentModal } from "../components/PaymentModal";
import MobileMenu from "../components/MobileMenu";
import AthleteHeader from "../components/AthleteHeader";
import SEOHead from "../components/SEOHead";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import {
  PublicTournamentService,
  AuthService,
  type PublicTournament,
} from "../services/api";


const TournamentProfile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [activeSubTab, setActiveSubTab] = useState("general");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("Todas as Quadras");
  const [selectedDate, setSelectedDate] = useState("");

  // Dados reais
  const [tournament, setTournament] = useState<PublicTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Task 4.4 — live scoring polling
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const isAthlete = currentUser?.type?.toUpperCase() === "ATHLETE";
  const isClub = currentUser?.type?.toUpperCase() === "CLUB";
  const { pathname } = useLocation();

  // Formulário de inscrição
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    player1Name: "",
    player1Email: "",
    player2Name: "",
    player2Email: "",
    category: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // Task 3.2 — payment flow
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTeamId, setPaymentTeamId] = useState("");
  // Rastrea inscrição feita nesta sessão (antes de confirmação de pagamento)
  const [registeredPending, setRegisteredPending] = useState(false);
  // useMemo deve ficar antes de qualquer return condicional (Rules of Hooks)
  const existingMyRegistration = useMemo(() => {
    if (!currentUser?.email || !tournament?.teams) return null;
    return (
      tournament.teams.find(
        (t) => t.player1Email === currentUser.email || t.player2Email === currentUser.email,
      ) ?? null
    );
  }, [tournament?.teams, currentUser?.email]);
  const isAlreadyRegistered = registeredPending || !!existingMyRegistration;
  const isPendingPayment =
    isAlreadyRegistered && !registerSuccess && existingMyRegistration?.status !== "CONFIRMED";
  // Super 8 — dados públicos de partidas/ranking
  const [super8Data, setSuper8Data] = useState<{ players: any[]; matches: any[] } | null>(null);

  const handleOpenRegister = () => {
    if (isAthlete && currentUser) {
      setRegisterForm((prev) => ({
        ...prev,
        player1Name: currentUser.name ?? "",
        player1Email: currentUser.email ?? "",
      }));
    }
    if ((tournament as any)?.tournamentType === "Super 8") {
      setRegisterForm((prev) => ({
        ...prev,
        category: (tournament as any)?.categories?.[0] ?? "Super 8",
      }));
    }
    setShowRegisterForm(true);
  };

  useEffect(() => {
    if (!id) return;
    // Verifica se atleta já se inscreveu nesta sessão anterior (localStorage)
    try {
      const pending = JSON.parse(localStorage.getItem("bubble_pending_reg") ?? "{}");
      if (pending[id]) setRegisteredPending(true);
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!id) return;
    PublicTournamentService.get(id)
      .then((t) => {
        setTournament(t);
        // Auto-abrir modal se vier com ?register=true
        if (searchParams.get("register") === "true") {
          const status = t.status?.toLowerCase() ?? "";
          if (status === "open") {
            const user = AuthService.getCurrentUser();
            if (user?.type?.toUpperCase() === "ATHLETE") {
              setRegisterForm((prev) => ({
                ...prev,
                player1Name: user.name ?? "",
                player1Email: user.email ?? "",
              }));
              setShowRegisterForm(true);
            } else if (!user) {
              setIsAuthModalOpen(true);
            }
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  // Task 4.4 — polling 30s quando torneio está ONGOING
  useEffect(() => {
    if (!id || tournament?.status?.toLowerCase() !== "ongoing") return;
    setLastUpdated(new Date());
    const interval = setInterval(() => {
      setIsRefreshing(true);
      PublicTournamentService.get(id)
        .then((t) => {
          setTournament(t);
          setLastUpdated(new Date());
        })
        .catch(console.error)
        .finally(() => setIsRefreshing(false));
    }, 30000);
    return () => clearInterval(interval);
  }, [id, tournament?.status]);

  useEffect(() => {
    if (!id || (tournament as any)?.tournamentType !== "Super 8") return;
    PublicTournamentService.getSuper8(id)
      .then(setSuper8Data)
      .catch(() => {});
  }, [id, tournament]);

  const isSuper8Tournament = (tournament as any)?.tournamentType === "Super 8";

  const handleRegister = async () => {
    if (
      !id ||
      !registerForm.player1Name ||
      !registerForm.player1Email ||
      (!isSuper8Tournament && (!registerForm.player2Name || !registerForm.player2Email)) ||
      (!isSuper8Tournament && !registerForm.category)
    ) {
      setRegisterError("Preencha todos os campos.");
      return;
    }
    if (!acceptedTerms) {
      setRegisterError("Você precisa aceitar os Termos de Uso para continuar.");
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    try {
      const payload = isSuper8Tournament
        ? { ...registerForm, player2Name: "", player2Email: "" }
        : registerForm;
      const result = await PublicTournamentService.register(id, payload);
      const newTeamId = (result as any)?.id ?? "";
      setShowRegisterForm(false);
      setRegisteredPending(true);
      try {
        const pending = JSON.parse(localStorage.getItem("bubble_pending_reg") ?? "{}");
        pending[id] = { teamId: newTeamId, at: Date.now() };
        localStorage.setItem("bubble_pending_reg", JSON.stringify(pending));
      } catch {}

      // Adiciona o time ao estado local para aparecer na lista imediatamente
      setTournament((prev) =>
        prev
          ? {
              ...prev,
              teams: [
                ...(prev.teams ?? []),
                {
                  id: newTeamId,
                  player1Name: registerForm.player1Name,
                  player1Email: registerForm.player1Email,
                  player2Name: registerForm.player2Name,
                  player2Email: registerForm.player2Email,
                  category: registerForm.category,
                  status: "PENDING",
                  player1AthleteId: null,
                  player2AthleteId: null,
                },
              ],
            }
          : prev,
      );

      // Se torneio tem valor → mostra modal de pagamento
      if (tournament && tournament.priceFirstCategory > 0) {
        setPaymentTeamId(newTeamId);
        setShowPayment(true);
      } else {
        // Torneio gratuito → confirma direto
        setRegisterSuccess(true);
      }
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          const fieldMap: Record<string, string> = {
            player1Name: "Nome do Jogador 1",
            player1Email: "Email do Jogador 1",
            player2Name: "Nome do Jogador 2",
            player2Email: "Email do Jogador 2",
            category: "Categoria",
          };
          const field = parsed[0]?.path?.[0];
          const fieldLabel = field ? (fieldMap[field] ?? field) : "";
          const msg =
            parsed[0].message === "Invalid email"
              ? "Email inválido"
              : parsed[0].message;
          setRegisterError(fieldLabel ? fieldLabel + ": " + msg : msg);
        } else {
          setRegisterError("Erro ao realizar inscrição.");
        }
      } catch {
        setRegisterError(err.message ?? "Erro ao realizar inscrição.");
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const tabs = isSuper8Tournament
    ? [
        { id: "info", label: "Informações" },
        { id: "participants", label: "Atletas" },
        { id: "partidas", label: "Partidas & Ranking" },
      ]
    : [
        { id: "info", label: "Informações" },
        { id: "participants", label: "Inscritos" },
        { id: "groups", label: "Grupos" },
        { id: "matches", label: "Jogos" },
        { id: "playoffs", label: "Playoffs" },
        { id: "live", label: "Ao Vivo" },
        { id: "results", label: "Resultados" },
      ];

  const infoSubTabs = [
    { id: "general", label: "Gerais" },
    { id: "contact", label: "Contato" },
    { id: "location", label: "Localização" },
    { id: "rules", label: "Regras" },
    { id: "faq", label: "FAQ" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmado":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Pendente":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "Finalizado":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Agendado":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "Ao Vivo":
        return "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (notFound || !tournament)
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center px-4">
        <EmptyState
          theme="dark"
          icon="🎾"
          title="Torneio não encontrado"
          description="O torneio que você está procurando não existe ou foi removido."
          action={
            <Link
              to="/tournaments"
              className="inline-block mt-2 px-5 py-2.5 bg-[#00ff88] text-[#0a0e1a] text-sm font-extrabold rounded-xl hover:bg-[#00dd77] transition-colors"
            >
              Ver todos os torneios
            </Link>
          }
        />
      </div>
    );

  // Helpers para dados reais
  const tournamentName = tournament.name;
  const clubName = tournament.club?.name ?? "—";
  const clubId = (tournament.club as any)?.id ?? null;
  const clubCity = tournament.club?.city ?? "—";
  const clubState = tournament.club?.state ?? "—";
  const clubPhone = tournament.club?.phone ?? "—";
  const totalTeams = tournament._count?.teams ?? tournament.totalTeams ?? 0;
  const statusRaw = tournament.status?.toLowerCase() ?? "";
  const isOpen = statusRaw === "open";
  const sportMap: Record<string, string> = {
    PADEL: "Padel",
    BEACH_TENNIS: "Beach Tennis",
    TENIS: "Tênis",
    PICKLEBALL: "Pickleball",
  };
  const sportLabel = sportMap[tournament.sport] ?? tournament.sport;
  // Label do torneio em si
  const tournamentStatusMap: Record<string, string> = {
    open: "Inscrições Abertas",
    published: "Em Breve",
    closed: "Inscrições Encerradas",
    ongoing: "Em Andamento",
    completed: "Encerrado",
    draft: "Rascunho",
  };
  const statusLabel = tournamentStatusMap[statusRaw] ?? tournament.status;
  // Label das inscrições
  const inscricaoLabel =
    statusRaw === "open"
      ? "Abertas"
      : statusRaw === "closed" ||
          statusRaw === "ongoing" ||
          statusRaw === "completed"
        ? "Encerradas"
        : "Não abertas";
  const confirmedTeams = tournament.teams ?? [];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {tournament ? (
        <SEOHead
          title={tournament.name}
          description={
            tournament.description
              ? tournament.description.slice(0, 160)
              : `Torneio de ${sportLabel}${tournament.club?.city ? ` em ${tournament.club.city}, ${tournament.club.state}` : ""}. Inscreva-se no Bubble Padel.`
          }
          url={`https://bubblepadel.com/tournaments/${id}`}
          type="article"
        />
      ) : (
        <SEOHead title="Torneio — Bubble Padel" />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        returnUrl={`/tournaments/${id}?register=true`}
      />

      {/* Navigation */}
      {isAthlete ? (
        <AthleteHeader />
      ) : (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#0a0e27]"
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
              <span className="text-2xl font-bold tracking-tight">Bubble</span>
            </Link>

            <div className="hidden md:flex items-center gap-4 md:gap-8">
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Início
              </Link>
              <Link
                to="/tournaments"
                className="text-white font-medium text-sm"
              >
                Torneios
              </Link>
              <Link
                to="/contact"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Contato
              </Link>
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={isAthlete ? "/athlete/dashboard" : "/dashboard"}
                    className="px-6 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/20 transition-all"
                  >
                    {currentUser.name?.split(" ")[0] ?? "Painel"}
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate("/");
                    }}
                    className="px-4 py-2.5 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-2.5 bg-[#00ff88] text-[#0a0e27] rounded-lg font-semibold text-sm hover:bg-[#00dd77] transition-all"
                >
                  Entrar
                </button>
              )}
            </div>

            <MobileMenu onLoginClick={() => setIsAuthModalOpen(true)} currentUser={currentUser as any} />
          </div>
        </div>
      </nav>
      )}

      {/* Hero */}
      <section className="relative pt-20 pb-6 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-sm text-gray-400">
            <Link to="/tournaments" className="hover:text-[#00ff88]">
              Torneios
            </Link>
            <span className="mx-2">/</span>
            <span>{tournamentName}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
            <div className="lg:col-span-3">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1.5 bg-[#00ff88]/20 text-[#00ff88] rounded-full text-[12px] font-extrabold border border-[#00ff88]/30 tracking-wide">
                  {statusLabel}
                </span>
                <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-[12px] font-extrabold border border-blue-500/30 tracking-wide">
                  {sportLabel}
                </span>
                {(() => {
                  const type = (tournament as any).tournamentType ?? "Regular (Grupo + Playoffs)";
                  const typeLabel = type === "Super 8" ? "Super 8" : type === "Eliminatorias Diretas" ? "Eliminatórias" : "Grupos + Playoffs";
                  const typeCls = type === "Super 8" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : type === "Eliminatorias Diretas" ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : "bg-teal-500/20 text-teal-300 border-teal-500/30";
                  return (
                    <span className={`px-3 py-1.5 rounded-full text-[12px] font-extrabold border tracking-wide ${typeCls}`}>
                      {typeLabel}
                    </span>
                  );
                })()}
              </div>

              <h1 className="text-[26px] sm:text-[32px] md:text-[40px] lg:text-[48px] font-black mb-4 leading-tight tracking-tight">
                {tournamentName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-gray-300 mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#00ff88]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {clubId ? (
                    <Link
                      to={`/clubs/${clubId}`}
                      className="hover:text-[#00ff88] transition-colors underline underline-offset-2"
                    >
                      {clubName}
                    </Link>
                  ) : (
                    <span>{clubName}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#00ff88]"
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
                  <span>
                    {clubCity}/{clubState}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#00ff88]"
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
                  <span>{(() => {
                    const s = (tournament.startDate ?? "").slice(0, 10);
                    const e = (tournament.endDate ?? "").slice(0, 10);
                    const start = new Date(s + "T12:00:00").toLocaleDateString("pt-BR");
                    const end = new Date(e + "T12:00:00").toLocaleDateString("pt-BR");
                    return s === e ? start : `${start} – ${end}`;
                  })()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#00ff88]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>
                    {totalTeams}
                    {(isSuper8Tournament ? 8 : tournament.maxTeams) < 999
                      ? `/${isSuper8Tournament ? 8 : tournament.maxTeams}`
                      : ""}{" "}
                    {isSuper8Tournament ? "atletas" : "duplas"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] p-5 rounded-xl border border-white/10 sticky top-28">
                {registerSuccess ? (
                  <div className="w-full py-3.5 bg-green-600/20 border border-green-500/30 text-green-300 rounded-lg font-bold text-base text-center mb-4">
                    ✓ Inscrição realizada! Aguarde confirmação do clube.
                  </div>
                ) : isPendingPayment ? (
                  <div className="w-full py-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg font-bold text-base text-center mb-4">
                    Inscrito — Aguardando Pagamento
                  </div>
                ) : isOpen && isClub ? (
                  <div className="w-full py-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg font-bold text-base text-center mb-4 cursor-not-allowed">
                    Inscrição exclusiva para atletas
                  </div>
                ) : isOpen && !currentUser ? (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e27] rounded-lg font-bold text-base transition-all hover:scale-[1.02] shadow-lg mb-4"
                  >
                    Inscrever-se
                  </button>
                ) : isOpen && isAthlete ? (
                  <button
                    onClick={handleOpenRegister}
                    className="w-full py-3.5 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e27] rounded-lg font-bold text-base transition-all hover:scale-[1.02] shadow-lg mb-4"
                  >
                    Inscrever-se
                  </button>
                ) : (
                  <div
                    className={
                      "w-full py-3.5 border rounded-lg font-bold text-base text-center mb-4 cursor-not-allowed " +
                      (tournament.status?.toLowerCase() === "closed"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-white/5 border-white/10 text-gray-400")
                    }
                  >
                    {tournament.status?.toLowerCase() === "closed"
                      ? "Inscrições Encerradas"
                      : tournament.status?.toLowerCase() === "ongoing"
                        ? "Torneio em Andamento"
                        : tournament.status?.toLowerCase() === "completed"
                          ? "Torneio Finalizado"
                          : "Inscrições Em Breve"}
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-white/10">
                  {tournament.maxTeams < 999 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Vagas disponíveis</span>
                        <span className="font-semibold text-[#00ff88]">
                          {tournament.maxTeams - totalTeams}
                        </span>
                      </div>
                      <div className="w-full bg-[#0a0e27] rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((totalTeams / tournament.maxTeams) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                  <div className="pt-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">
                        Estado das inscrições
                      </span>
                      <span
                        className={`font-semibold ${inscricaoLabel === "Abertas" ? "text-[#00ff88]" : inscricaoLabel === "Encerradas" ? "text-red-400" : "text-gray-300"}`}
                      >
                        {inscricaoLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="sticky top-16 z-40 bg-[#0a0e27]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex overflow-x-auto flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "info") setActiveSubTab("general");
                  }}
                  className={`px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#00ff88] text-[#00ff88]"
                      : "border-transparent text-gray-300 hover:text-white"
                  } font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Share Button */}
            <button
              className="ml-4 p-3 hover:bg-white/5 rounded-lg transition-colors"
              title="Compartilhar"
            >
              <svg
                className="w-5 h-5 text-gray-400 hover:text-white transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Sub-tabs for Info */}
      {activeTab === "info" && (
        <section className="bg-[#0f1540]/30 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-1">
              {infoSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeSubTab === subTab.id
                      ? "text-[#00ff88] bg-[#00ff88]/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  } rounded-t-lg`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-8 md:py-12 px-4 md:px-6 lg:px-8 pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto">
          {/* INFO TAB */}
          {activeTab === "info" && (
            <>
              {/* General Sub-tab */}
              {activeSubTab === "general" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                      <h2 className="text-2xl font-bold mb-4">
                        Descrição do Torneio
                      </h2>
                      <p className="text-gray-300 leading-relaxed mb-6">
                        {tournament.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-white/10">
                        <div>
                          <h3 className="font-semibold text-[#00ccff] mb-2">
                            Inscrições
                          </h3>
                          <p className="text-gray-300">{inscricaoLabel}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00ccff] mb-2">
                            Valor da Inscrição
                          </h3>
                          <p className="text-gray-300">
                            {`R$ ${tournament.priceFirstCategory.toFixed(2).replace(".", ",")}`}{" "}
                            por atleta
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isSuper8Tournament && (
                    <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                      <h2 className="text-2xl font-bold mb-4">
                        Categorias Disponíveis
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tournament.categories.map(
                          (category: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-[#0a0e27]"
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
                              </div>
                              <span className="font-medium">{category}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                      <h3 className="font-bold mb-4">Detalhes Rápidos</h3>
                      <div className="space-y-3 text-sm">
                        {!isSuper8Tournament && (
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                          <svg
                            className="w-5 h-5 text-[#00ff88]"
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
                          <div>
                            <p className="text-gray-400">Data do Evento</p>
                            <p className="text-white font-medium">
                              {(() => {
                                const s = (tournament.startDate ?? "").slice(0, 10);
                                const e = (tournament.endDate ?? "").slice(0, 10);
                                const start = new Date(s + "T12:00:00").toLocaleDateString("pt-BR");
                                const end = new Date(e + "T12:00:00").toLocaleDateString("pt-BR");
                                return s === e ? start : `${start} – ${end}`;
                              })()}
                            </p>
                          </div>
                        </div>
                        )}
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                          <svg
                            className="w-5 h-5 text-[#00ff88]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-gray-400">Inscritos</p>
                            <p className="text-white font-medium">
                              {totalTeams}
                              {(isSuper8Tournament ? 8 : tournament.maxTeams) < 999
                                ? ` de ${isSuper8Tournament ? 8 : tournament.maxTeams}`
                                : ""}{" "}
                              {isSuper8Tournament ? "atletas" : "duplas"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-[#00ff88]"
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
                          <div>
                            <p className="text-gray-400">Investimento</p>
                            <p className="text-white font-medium">
                              {`R$ ${tournament.priceFirstCategory.toFixed(2).replace(".", ",")}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                      <h3 className="font-bold mb-4">Sobre o Clube</h3>
                      <p className="text-gray-300 text-sm mb-4">{clubName}</p>
                      <a
                        href={`https://wa.me/${clubPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Sub-tab */}
              {activeSubTab === "contact" && (
                <div className="max-w-3xl">
                  <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-8 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold mb-6">
                      Informações de Contato
                    </h2>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-[#0a0e27]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00ccff] mb-1">
                            Telefone
                          </h3>
                          <a
                            href={`tel:${clubPhone}`}
                            className="text-gray-300 hover:text-white transition-colors"
                          >
                            {clubPhone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#00ccff] to-[#0099cc] rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-[#0a0e27]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00ccff] mb-1">
                            Email
                          </h3>
                          <a
                            href={`mailto:${"—"}`}
                            className="text-gray-300 hover:text-white transition-colors"
                          >
                            {"—"}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00ccff] mb-1">
                            Website
                          </h3>
                          <a
                            href={`https://${"—"}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-white transition-colors"
                          >
                            {"—"}
                          </a>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <h3 className="font-semibold text-[#00ccff] mb-4">
                          Redes Sociais
                        </h3>
                        <div className="flex gap-4">
                          <a
                            href="#"
                            className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </a>
                          <a
                            href="#"
                            className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Sub-tab */}
              {activeSubTab === "location" && (
                <div className="max-w-3xl">
                  <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-8 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold mb-6">
                      Localização do Evento
                    </h2>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-[#0a0e27]"
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
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00ccff] mb-2">
                            Endereço
                          </h3>
                          <p className="text-gray-300">{tournament.clubSede}</p>
                        </div>
                      </div>

                      <div className="aspect-video bg-white/5 rounded-lg overflow-hidden border border-white/10">
                        <iframe
                          src={`https://maps.google.com/maps?q=-23.5505,-46.6333&z=15&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                        ></iframe>
                      </div>

                      <div className="flex gap-4">
                        <a
                          href={"#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00ff88] hover:bg-[#00dd77] text-[#0a0e27] rounded-lg font-semibold transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          Abrir no Google Maps
                        </a>
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <h3 className="font-semibold text-[#00ccff] mb-4">
                          Como Chegar
                        </h3>
                        <div className="space-y-3 text-gray-300">
                          <div className="flex gap-3">
                            <span className="text-[#00ff88]">🚗</span>
                            <p>
                              Estacionamento gratuito disponível para
                              participantes
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-[#00ff88]">🚇</span>
                            <p>
                              Estação de metrô mais próxima: Consolação (Linha
                              Verde)
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-[#00ff88]">🚌</span>
                            <p>Linhas de ônibus: 107M, 209P, 875T</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rules Sub-tab */}
              {activeSubTab === "rules" && (
                <div className="max-w-3xl">
                  <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-8 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold mb-6">
                      Regras do Torneio
                    </h2>

                    <div className="space-y-4">
                      {[].map((rule, index) => (
                        <div
                          key={index}
                          className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[#0a0e27] font-bold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <p className="text-gray-300 leading-relaxed pt-1">
                            {rule}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex gap-3">
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0"
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
                        <div>
                          <h3 className="font-semibold text-blue-400 mb-2">
                            Informação Importante
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Todos os participantes devem estar cientes e
                            concordar com as regras antes da inscrição. O não
                            cumprimento das regras pode resultar em
                            desclassificação do torneio.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ Sub-tab */}
              {activeSubTab === "faq" && (
                <div className="max-w-3xl">
                  <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-8 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold mb-6">
                      Perguntas Frequentes
                    </h2>

                    <div className="space-y-4">
                      {([] as Array<{ q: string; a: string }>).map(
                        (item, index) => (
                          <div
                            key={index}
                            className="p-5 bg-white/5 rounded-lg border border-white/10"
                          >
                            <h3 className="font-semibold text-[#00ccff] mb-3 flex items-start gap-2">
                              <svg
                                className="w-5 h-5 flex-shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {item.q}
                            </h3>
                            <p className="text-gray-300 ml-7">{item.a}</p>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-r from-[#00ff88]/10 to-[#00ccff]/10 border border-[#00ff88]/30 rounded-lg">
                      <h3 className="font-semibold text-[#00ff88] mb-2">
                        Ainda tem dúvidas?
                      </h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Entre em contato conosco através do WhatsApp ou email.
                        Estamos prontos para ajudar!
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`https://wa.me/${clubPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`mailto:${"—"}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          Enviar Email
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PARTICIPANTS TAB */}
          {activeTab === "participants" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">
                  {isSuper8Tournament ? "Atletas Inscritos" : "Duplas Inscritas"}
                </h2>
                <p className="text-gray-400 mb-4">
                  Total de {confirmedTeams.length}{" "}
                  {isSuper8Tournament ? "atletas confirmados" : "duplas confirmadas"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar atleta..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88] text-sm"
                    />
                  </div>
                  {!isSuper8Tournament && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-48 px-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00ff88] text-sm"
                  >
                    <option value="Todas">Todas as Categorias</option>
                    {tournament.categories.map((cat: string) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {confirmedTeams
                  .filter(
                    (p: {
                      player1Name: string;
                      player2Name: string;
                      category: string;
                    }) =>
                      (isSuper8Tournament || selectedCategory === "Todas" || p.category === selectedCategory) &&
                      (searchTerm === "" ||
                        p.player1Name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        (!isSuper8Tournament &&
                          p.player2Name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()))),
                  )
                  .map(
                    (participant: {
                      id: string;
                      player1Name: string;
                      player2Name: string;
                      category: string;
                      status: string;
                      player1AthleteId?: string | null;
                      player2AthleteId?: string | null;
                    }) => (
                      <div
                        key={participant.id}
                        className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-5 rounded-xl border border-white/10 hover:border-[#00ff88]/30 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-[#0a0e27]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {participant.player1AthleteId ? (
                                  <Link
                                    to={currentUser ? `/athlete/${participant.player1AthleteId}` : `/athletes/${participant.player1AthleteId}`}
                                    className="hover:text-[#00ff88] transition-colors"
                                  >
                                    {participant.player1Name}
                                  </Link>
                                ) : participant.player1Name}
                                {!isSuper8Tournament && (
                                  <>
                                    {" / "}
                                    {participant.player2AthleteId ? (
                                      <Link
                                        to={currentUser ? `/athlete/${participant.player2AthleteId}` : `/athletes/${participant.player2AthleteId}`}
                                        className="hover:text-[#00ff88] transition-colors"
                                      >
                                        {participant.player2Name}
                                      </Link>
                                    ) : participant.player2Name}
                                  </>
                                )}
                              </h3>
                              {!isSuper8Tournament && (
                              <p className="text-gray-400 text-sm">
                                Categoria: {participant.category}
                              </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${participant.status === "CONFIRMED" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}
                          >
                            {participant.status === "CONFIRMED"
                              ? "Confirmado"
                              : "A Confirmar"}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                {confirmedTeams.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    {isSuper8Tournament ? "Nenhum atleta confirmado ainda." : "Nenhuma dupla confirmada ainda."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUPER 8 — PARTIDAS & RANKING TAB */}
          {activeTab === "partidas" && isSuper8Tournament && (
            <div className="space-y-8">
              {/* Ranking */}
              <div>
                <h2 className="text-xl font-bold mb-4">Ranking</h2>
                {super8Data && super8Data.players.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase">
                          <th className="text-left px-4 py-3">#</th>
                          <th className="text-left px-4 py-3">Atleta</th>
                          <th className="text-center px-4 py-3">V</th>
                          <th className="text-center px-4 py-3">D</th>
                          <th className="text-center px-4 py-3">GP</th>
                          <th className="text-center px-4 py-3">GC</th>
                          <th className="text-center px-4 py-3">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...super8Data.players]
                          .sort((a, b) => b.wins - a.wins || (b.gamesFor - b.gamesAgainst) - (a.gamesFor - a.gamesAgainst))
                          .map((player, idx) => (
                            <tr key={player.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-3 font-semibold">{player.name}</td>
                              <td className="px-4 py-3 text-center text-green-400 font-semibold">{player.wins}</td>
                              <td className="px-4 py-3 text-center text-red-400">{player.losses}</td>
                              <td className="px-4 py-3 text-center">{player.gamesFor}</td>
                              <td className="px-4 py-3 text-center">{player.gamesAgainst}</td>
                              <td className="px-4 py-3 text-center font-semibold">
                                <span className={player.gamesFor - player.gamesAgainst >= 0 ? "text-green-400" : "text-red-400"}>
                                  {player.gamesFor - player.gamesAgainst > 0 ? "+" : ""}{player.gamesFor - player.gamesAgainst}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">Nenhuma partida registrada ainda.</p>
                )}
              </div>

              {/* Rodadas */}
              {super8Data && super8Data.matches.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Partidas</h2>
                  <div className="space-y-6">
                    {Array.from({ length: 7 }, (_, i) => i + 1).map((round) => {
                      const roundMatches = super8Data.matches.filter((m) => m.round === round);
                      if (roundMatches.length === 0) return null;
                      return (
                        <div key={round}>
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Rodada {round}
                          </h3>
                          <div className="space-y-3">
                            {roundMatches.map((match) => {
                              const p = super8Data.players;
                              const t1p1 = p.find((x) => x.order === match.team1p1)?.name ?? "—";
                              const t1p2 = p.find((x) => x.order === match.team1p2)?.name ?? "—";
                              const t2p1 = p.find((x) => x.order === match.team2p1)?.name ?? "—";
                              const t2p2 = p.find((x) => x.order === match.team2p2)?.name ?? "—";
                              const played = match.played;
                              const t1Won = played && match.score1 > match.score2;
                              const t2Won = played && match.score2 > match.score1;
                              return (
                                <div key={match.id} className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 rounded-xl border border-white/10 p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className={`flex-1 text-right ${t1Won ? "text-[#00ff88] font-bold" : "text-white"}`}>
                                      <p className="text-sm">{t1p1}</p>
                                      <p className="text-sm">{t1p2}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-lg font-bold min-w-[80px] justify-center">
                                      {played ? (
                                        <>
                                          <span className={t1Won ? "text-[#00ff88]" : "text-gray-400"}>{match.score1}</span>
                                          <span className="text-gray-600">×</span>
                                          <span className={t2Won ? "text-[#00ff88]" : "text-gray-400"}>{match.score2}</span>
                                        </>
                                      ) : (
                                        <span className="text-gray-600 text-sm font-normal">vs</span>
                                      )}
                                    </div>
                                    <div className={`flex-1 ${t2Won ? "text-[#00ff88] font-bold" : "text-white"}`}>
                                      <p className="text-sm">{t2p1}</p>
                                      <p className="text-sm">{t2p2}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GROUPS TAB */}
          {activeTab === "groups" && (
            <div>
              {/* Filters */}
              <div className="mb-6 grid md:grid-cols-[1fr,auto] gap-4">
                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nome do atleta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88] transition-colors"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00ff88] appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="Todas">Categorias</option>
                  {tournament.categories.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Groups grouped by category */}
              {(() => {
                const allGroups = (tournament.groups ?? []).filter(
                  (g: any) =>
                    selectedCategory === "Todas" ||
                    g.category === selectedCategory,
                );
                if (allGroups.length === 0)
                  return (
                    <div className="text-center py-20 text-gray-400">
                      Grupos ainda não foram gerados para este torneio.
                    </div>
                  );
                // Agrupar por categoria
                const byCategory: Record<string, any[]> = {};
                allGroups.forEach((g: any) => {
                  if (!byCategory[g.category]) byCategory[g.category] = [];
                  byCategory[g.category].push(g);
                });
                return Object.entries(byCategory).map(([cat, groups]) => (
                  <div key={cat} className="mb-10">
                    <h2 className="text-xl font-bold text-[#00ccff] mb-4 pb-2 border-b border-white/10">
                      {cat}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {groups.map((group: any, groupIndex: number) => {
                        const standings = (group.teams ?? [])
                          .map((gt: any) => {
                            const t = gt.team;
                            let wins = 0,
                              losses = 0,
                              gamesFor = 0,
                              gamesAgainst = 0;
                            (group.matches ?? []).forEach((m: any) => {
                              if (!m.played) return;
                              const isT1 = m.team1Id === t.id;
                              const isT2 = m.team2Id === t.id;
                              if (!isT1 && !isT2) return;
                              const myScore = isT1 ? m.score1 : m.score2;
                              const oppScore = isT1 ? m.score2 : m.score1;
                              if (myScore > oppScore) wins++;
                              else losses++;
                              gamesFor += myScore ?? 0;
                              gamesAgainst += oppScore ?? 0;
                            });
                            return {
                              ...t,
                              wins,
                              losses,
                              gamesFor,
                              gamesAgainst,
                              points: wins * 2,
                            };
                          })
                          .sort(
                            (a: any, b: any) =>
                              b.points - a.points ||
                              b.gamesFor -
                                b.gamesAgainst -
                                (a.gamesFor - a.gamesAgainst),
                          );

                        return (
                          <div
                            key={group.id ?? groupIndex}
                            className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 rounded-xl border border-white/10 overflow-hidden"
                          >
                            <div className="bg-gradient-to-r from-purple-600/30 to-purple-700/30 px-6 py-4 border-b border-white/10">
                              <h3 className="font-bold text-lg">
                                {group.name}
                              </h3>
                            </div>
                            <div className="p-6">
                              {/* Standings */}
                              <div className="mb-4">
                                <div className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-3 text-xs font-semibold text-gray-400 uppercase pb-3 border-b border-white/10">
                                  <div className="w-8"></div>
                                  <div>Dupla</div>
                                  <div className="text-center w-12">V</div>
                                  <div className="text-center w-16">Saldo</div>
                                  <div className="text-center w-16">Pts</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {standings.map((team: any, ti: number) => (
                                  <div
                                    key={team.id}
                                    className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-3 items-center py-2 hover:bg-white/5 rounded-lg transition-colors"
                                  >
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${ti === 0 ? "bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#0a0e27]" : ti === 1 ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white" : "bg-white/10 text-gray-400"}`}
                                    >
                                      {ti + 1}
                                    </div>
                                    <div className="text-white truncate">
                                      {team.player1AthleteId ? (
                                        <Link
                                          to={currentUser ? `/athlete/${team.player1AthleteId}` : `/athletes/${team.player1AthleteId}`}
                                          className="hover:text-[#00ff88] transition-colors"
                                        >
                                          {team.player1Name}
                                        </Link>
                                      ) : team.player1Name}
                                      {" / "}
                                      {team.player2AthleteId ? (
                                        <Link
                                          to={currentUser ? `/athlete/${team.player2AthleteId}` : `/athletes/${team.player2AthleteId}`}
                                          className="hover:text-[#00ff88] transition-colors"
                                        >
                                          {team.player2Name}
                                        </Link>
                                      ) : team.player2Name}
                                    </div>
                                    <div className="text-center w-12 font-bold text-green-400">
                                      {team.wins}
                                    </div>
                                    <div
                                      className={`text-center w-16 font-bold ${team.gamesFor - team.gamesAgainst >= 0 ? "text-green-400" : "text-red-400"}`}
                                    >
                                      {team.gamesFor - team.gamesAgainst > 0
                                        ? "+"
                                        : ""}
                                      {team.gamesFor - team.gamesAgainst}
                                    </div>
                                    <div className="text-center w-16 font-bold text-white">
                                      {team.points}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {/* Matches com schedule */}
                              <div className="mt-6 pt-6 border-t border-white/10">
                                <h4 className="font-semibold text-sm text-gray-400 mb-3">
                                  Jogos
                                </h4>
                                <div className="space-y-2">
                                  {(group.matches ?? []).map((m: any) => {
                                    const getTeamName = (
                                      teamId: string | null,
                                    ) => {
                                      if (!teamId) return "A definir";
                                      const gt = group.teams.find(
                                        (gt: any) => gt.team.id === teamId,
                                      );
                                      return gt
                                        ? `${gt.team.player1Name} / ${gt.team.player2Name}`
                                        : "A definir";
                                    };
                                    const t1Name = getTeamName(m.team1Id);
                                    const t2Name = getTeamName(m.team2Id);
                                    const sch = m.schedule;
                                    const scheduleStr = sch
                                      ? `${sch.court} · ${sch.time ?? ""} · ${sch.date ? new Date(String(sch.date).slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}`
                                          .trim()
                                          .replace(/·\s*$/, "")
                                      : null;
                                    return (
                                      <div
                                        key={m.id}
                                        className="bg-white/5 rounded-lg p-3"
                                      >
                                        {scheduleStr && (
                                          <p className="text-xs text-gray-500 mb-1">
                                            {scheduleStr}
                                          </p>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-white truncate">
                                            {t1Name}
                                          </span>
                                          <span className="text-purple-400 font-bold mx-2 flex-shrink-0">
                                            {m.played
                                              ? `${m.score1}–${m.score2}`
                                              : "vs"}
                                          </span>
                                          <span className="text-white truncate text-right">
                                            {t2Name}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* MATCHES TAB */}
          {activeTab === "matches" && (
            <div>
              {/* Mobile Filter Toggle */}
              <div className="md:hidden mb-4">
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 border border-white/10 rounded-lg"
                >
                  <span className="font-semibold">Filtros</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${filtersExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* Filters Section */}
              <div
                className={`mb-6 ${!filtersExpanded ? "hidden md:block" : "block"}`}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-0">
                  {/* Search */}
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar atleta..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88] transition-colors"
                    />
                  </div>

                  {/* Court Filter */}
                  <select
                    value={selectedCourt}
                    onChange={(e) => setSelectedCourt(e.target.value)}
                    className="px-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00ff88] appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.5rem center",
                      backgroundSize: "1.5em 1.5em",
                      paddingRight: "2.5rem",
                    }}
                  >
                    <option value="Todas as Quadras">Todas as Quadras</option>
                    <option value="Quadra 1">Quadra 1</option>
                    <option value="Quadra 2">Quadra 2</option>
                    <option value="Quadra 3">Quadra 3</option>
                    <option value="Quadra Central">Quadra Central</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00ff88] appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.5rem center",
                      backgroundSize: "1.5em 1.5em",
                      paddingRight: "2.5rem",
                    }}
                  >
                    <option value="Todas">Categorias</option>
                    {tournament.categories.map((cat: string) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Date Filter - dropdown with tournament dates only */}
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2.5 bg-[#0a0e1a] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00ff88]"
                  >
                    <option value="">Todas as datas</option>
                    {((tournament.daySchedules as any[]) ?? []).map(
                      (ds: any) => {
                        const d = ds.date ? new Date(ds.date) : null;
                        const label = d
                          ? d.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : ds.date;
                        return (
                          <option key={ds.date} value={ds.date?.slice(0, 10)}>
                            {label}
                          </option>
                        );
                      },
                    )}
                  </select>
                </div>
              </div>

              {/* Matches List */}
              {(() => {
                const allMatches = (tournament.groups ?? [])
                  .flatMap((g: any) => {
                    const getTeamName = (teamId: string | null) => {
                      if (!teamId) return "A definir";
                      const gt = (g.teams ?? []).find(
                        (gt: any) => gt.team.id === teamId,
                      );
                      return gt
                        ? `${gt.team.player1Name} / ${gt.team.player2Name}`
                        : "A definir";
                    };
                    return (g.matches ?? []).map((m: any) => {
                      const sch = m.schedule;
                      const dateStr = sch?.date ? sch.date.slice(0, 10) : null;
                      return {
                        id: m.id,
                        team1: getTeamName(m.team1Id),
                        team2: getTeamName(m.team2Id),
                        score1: m.score1,
                        score2: m.score2,
                        played: m.played,
                        category: g.category,
                        court: sch?.court ?? null,
                        dateRaw: dateStr,
                        date: dateStr
                          ? new Date(dateStr + "T12:00:00").toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "short" },
                            )
                          : null,
                        time: sch?.time ?? null,
                        status: m.played
                          ? "Finalizado"
                          : sch
                            ? "Agendado"
                            : "A Realizar",
                      };
                    });
                  })
                  .sort((a: any, b: any) => {
                    // Sort by date then time
                    if (a.dateRaw && b.dateRaw && a.dateRaw !== b.dateRaw)
                      return a.dateRaw.localeCompare(b.dateRaw);
                    if (a.time && b.time) return a.time.localeCompare(b.time);
                    return 0;
                  });

                const filtered = allMatches.filter((m: any) => {
                  const cat =
                    selectedCategory === "Todas" ||
                    m.category === selectedCategory;
                  const court =
                    selectedCourt === "Todas as Quadras" ||
                    m.court === selectedCourt;
                  const date = !selectedDate || m.dateRaw === selectedDate;
                  const search =
                    searchTerm === "" ||
                    m.team1.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.team2.toLowerCase().includes(searchTerm.toLowerCase());
                  return cat && court && date && search;
                });
                if (filtered.length === 0)
                  return (
                    <div className="text-center py-12">
                      <h3 className="text-xl font-bold mb-2 text-gray-400">
                        Nenhum jogo encontrado
                      </h3>
                      <p className="text-gray-500">
                        {allMatches.length === 0
                          ? "Grupos ainda não foram gerados."
                          : "Tente ajustar os filtros."}
                      </p>
                    </div>
                  );
                return (
                  <div className="space-y-4">
                    {filtered.map((match: any) => (
                      <div
                        key={match.id}
                        className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 rounded-xl border border-white/10 overflow-hidden hover:border-[#00ff88]/30 transition-all"
                      >
                        <div className="p-4 md:p-6">
                          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-400 mb-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(match.status)}`}
                            >
                              {match.status}
                            </span>
                            {match.time && (
                              <>
                                <span>•</span>
                                <span className="font-medium">
                                  {match.time}
                                </span>
                              </>
                            )}
                            {match.court && (
                              <>
                                <span>•</span>
                                <span>{match.court}</span>
                              </>
                            )}
                            {match.date && (
                              <>
                                <span>•</span>
                                <span>{match.date}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-[#00ccff]">
                              {match.category}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-base md:text-lg text-white">
                                {match.team1}
                              </p>
                              {match.played && (
                                <span className="text-2xl md:text-3xl font-bold text-white ml-4">
                                  {match.score1}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-base md:text-lg text-white">
                                {match.team2}
                              </p>
                              {match.played && (
                                <span className="text-2xl md:text-3xl font-bold text-white ml-4">
                                  {match.score2}
                                </span>
                              )}
                            </div>
                          </div>
                          {!match.played && (
                            <p className="mt-3 text-xs text-gray-500">
                              Horário a definir
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* PLAYOFFS TAB */}
          {activeTab === "playoffs" && (
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-bold mb-2">Playoffs</h2>
                <p className="text-gray-400">
                  Bracket eliminatório por categoria
                </p>
              </div>

              {/* Category filter - ponto 5 */}
              {(tournament.playoffBrackets ?? []).length > 0 && (
                <div className="flex gap-2 flex-wrap mb-8 justify-center">
                  <button
                    onClick={() => setSelectedCategory("Todas")}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${selectedCategory === "Todas" ? "bg-[#00ccff]/20 border-[#00ccff] text-[#00ccff]" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"}`}
                  >
                    Todas
                  </button>
                  {tournament.categories.map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${selectedCategory === cat ? "bg-[#00ccff]/20 border-[#00ccff] text-[#00ccff]" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {(tournament.playoffBrackets ?? []).length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  Playoffs ainda não foram gerados para este torneio.
                </div>
              ) : (
                <div className="space-y-10">
                  {(tournament.playoffBrackets ?? [])
                    .filter(
                      (b: any) =>
                        selectedCategory === "Todas" ||
                        b.category === selectedCategory,
                    )
                    .map((bracket: any) => {
                      const rounds = [
                        ...new Set(
                          bracket.matches.map((m: any) => m.roundSize),
                        ),
                      ].sort((a: any, b: any) => b - a);
                      const getRoundName = (size: number) => {
                        if (size === 1) return "Final";
                        if (size === 2) return "Semifinal";
                        if (size === 4) return "Quartas";
                        if (size === 8) return "Oitavas";
                        return `Rodada de ${size * 2}`;
                      };
                      return (
                        <div
                          key={bracket.id}
                          className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10"
                        >
                          <h3 className="text-xl font-bold text-[#00ccff] mb-6">
                            {bracket.category}
                          </h3>
                          <div className="overflow-x-auto">
                            <div className="flex gap-8 min-w-max">
                              {(rounds as number[]).map((roundSize: number) => {
                                const roundMatches = bracket.matches.filter(
                                  (m: any) => m.roundSize === roundSize,
                                );
                                return (
                                  <div
                                    key={roundSize}
                                    className="flex flex-col gap-4"
                                  >
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide text-center mb-2">
                                      {getRoundName(roundSize)}
                                    </p>
                                    {roundMatches.map((m: any) => {
                                      const t1 = m.team1Label || "A definir";
                                      const t2 = m.team2Label || "A definir";
                                      const winner = m.winnerId;
                                      return (
                                        <div
                                          key={m.id}
                                          className="w-56 bg-[#0a0e27]/60 border border-white/10 rounded-lg overflow-hidden"
                                        >
                                          <div
                                            className={`px-3 py-2 flex items-center justify-between border-b border-white/10 ${winner && winner === m.team1Id ? "bg-[#00ff88]/10" : ""}`}
                                          >
                                            <span
                                              className={`text-sm font-medium truncate ${winner && winner === m.team1Id ? "text-[#00ff88]" : "text-white"}`}
                                            >
                                              {t1}
                                            </span>
                                            {m.played && (
                                              <span
                                                className={`ml-2 text-lg font-bold flex-shrink-0 ${winner === m.team1Id ? "text-[#00ff88]" : "text-gray-400"}`}
                                              >
                                                {m.score1}
                                              </span>
                                            )}
                                          </div>
                                          <div
                                            className={`px-3 py-2 flex items-center justify-between ${winner && winner === m.team2Id ? "bg-[#00ff88]/10" : ""}`}
                                          >
                                            <span
                                              className={`text-sm font-medium truncate ${winner && winner === m.team2Id ? "text-[#00ff88]" : "text-white"}`}
                                            >
                                              {t2}
                                            </span>
                                            {m.played && (
                                              <span
                                                className={`ml-2 text-lg font-bold flex-shrink-0 ${winner === m.team2Id ? "text-[#00ff88]" : "text-gray-400"}`}
                                              >
                                                {m.score2}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Transmissão por quadra - ponto 6 */}
                          {(tournament.courts ?? []).length > 0 && (
                            <div className="mt-8 pt-6 border-t border-white/10">
                              <h4 className="font-semibold text-sm text-gray-400 uppercase tracking-wide mb-4">
                                Transmissões
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {(tournament.courts ?? []).map(
                                  (court: string) => (
                                    <div
                                      key={court}
                                      className="bg-[#0a0e27]/60 border border-white/10 rounded-lg overflow-hidden"
                                    >
                                      <div className="relative aspect-video bg-black/40 flex items-center justify-center">
                                        <svg
                                          className="w-10 h-10 text-white/20"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                      </div>
                                      <p className="px-3 py-2 text-sm text-gray-400 text-center">
                                        {court}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === "results" && (
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold mb-2">Resultados</h2>
                <p className="text-gray-400">Resultados finais do torneio</p>
              </div>

              {(tournament.playoffBrackets ?? []).length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  Resultados ainda não disponíveis.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {(tournament.playoffBrackets ?? []).map((bracket: any) => {
                      const final = bracket.matches.find(
                        (m: any) => m.roundSize === 1 && m.played,
                      );
                      const semi = bracket.matches.filter(
                        (m: any) => m.roundSize === 2 && m.played,
                      );
                      if (!final)
                        return (
                          <div
                            key={bracket.id}
                            className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 rounded-xl border border-white/10 p-8 text-center text-gray-400"
                          >
                            <h3 className="font-bold text-xl text-white mb-2">
                              {bracket.category}
                            </h3>
                            Final ainda não realizada.
                          </div>
                        );
                      const champion =
                        final.score1 > final.score2
                          ? final.team1Label
                          : final.team2Label;
                      const runnerUp =
                        final.score1 > final.score2
                          ? final.team2Label
                          : final.team1Label;
                      return (
                        <div
                          key={bracket.id}
                          className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 rounded-xl border border-white/10 overflow-hidden"
                        >
                          <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00ccff]/20 px-6 py-4 border-b border-white/10">
                            <h3 className="font-bold text-xl text-white">
                              {bracket.category}
                            </h3>
                          </div>
                          <div className="p-8">
                            <div className="text-center mb-8 pb-8 border-b border-white/10">
                              <div className="flex items-center justify-center gap-3 mb-3">
                                <span className="text-4xl">👑</span>
                                <span className="text-4xl">🏆</span>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                Campeões
                              </h4>
                              <p className="text-2xl font-bold text-[#00ff88] mb-4">
                                {champion ?? "A definir"}
                              </p>
                              <div className="bg-[#0a0e27]/50 rounded-lg px-4 py-3 inline-block">
                                <p className="text-xs text-gray-400 mb-1">
                                  Placar da Final
                                </p>
                                <p className="text-xl font-bold text-white">
                                  {final.score1} – {final.score2}
                                </p>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-3 mb-3">
                                <span className="text-3xl">🥈</span>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                Vice-campeões
                              </h4>
                              <p className="text-lg font-semibold text-gray-300">
                                {runnerUp ?? "A definir"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Só mostrar parabéns se pelo menos 1 final foi jogada */}
                  {(tournament.playoffBrackets ?? []).some((b: any) =>
                    b.matches.some((m: any) => m.roundSize === 1 && m.played),
                  ) && (
                    <div className="mt-10 p-8 bg-gradient-to-r from-[#00ff88]/10 to-[#00ccff]/10 border border-[#00ff88]/30 rounded-xl text-center">
                      <h3 className="text-2xl font-bold text-[#00ff88] mb-2">
                        🎉 Parabéns aos Vencedores!
                      </h3>
                      <p className="text-gray-300 max-w-2xl mx-auto">
                        Obrigado a todos os participantes pelo excelente nível
                        de jogo e pelo espírito esportivo demonstrado ao longo
                        do torneio.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* LIVE TAB */}
          {activeTab === "live" && (
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Ao Vivo</h2>
                  <p className="text-gray-400 text-sm">
                    Jogos em andamento agora
                  </p>
                </div>
                {tournament?.status?.toLowerCase() === "ongoing" && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {isRefreshing ? (
                      <div className="w-4 h-4 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse inline-block" />
                    )}
                    <span>
                      {isRefreshing
                        ? "Atualizando..."
                        : lastUpdated
                          ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                          : "Ao vivo"}
                    </span>
                    <span className="text-gray-600">· atualiza a cada 30s</span>
                  </div>
                )}
              </div>

              {tournament?.status?.toLowerCase() !== "ongoing" ? (
                <div className="text-center py-20 text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-bold mb-2">
                    Torneio não está em andamento
                  </h3>
                  <p className="text-gray-500">
                    A aba Ao Vivo ficará disponível durante o torneio
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {(tournament.groups ?? [])
                    .map((group) => {
                      const today = new Date().toDateString();
                      const todayMatches = group.matches.filter((m) => {
                        const schedDate = m.schedule?.date
                          ? new Date(m.schedule.date).toDateString()
                          : null;
                        return schedDate === today || (!m.played && !schedDate);
                      });
                      if (todayMatches.length === 0) return null;

                      const teamsById = Object.fromEntries(
                        (group.teams ?? []).map((gt: any) => [
                          gt.team.id,
                          gt.team,
                        ]),
                      );

                      return (
                        <div key={group.id}>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
                            {group.name} — {group.category}
                          </h3>
                          <div className="space-y-3">
                            {todayMatches.map((match) => {
                              const t1 = teamsById[match.team1Id ?? ""];
                              const t2 = teamsById[match.team2Id ?? ""];
                              const isPlayed = match.played;
                              return (
                                <div
                                  key={match.id}
                                  className={`rounded-xl p-4 border ${isPlayed ? "bg-white/5 border-white/10" : "bg-[#00ff88]/5 border-[#00ff88]/20"}`}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 text-right">
                                      <p className="font-bold text-white text-sm">
                                        {t1
                                          ? `${t1.player1Name} / ${t1.player2Name}`
                                          : "A definir"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      {isPlayed ? (
                                        <span className="text-2xl font-black text-white tabular-nums">
                                          {match.score1} — {match.score2}
                                        </span>
                                      ) : (
                                        <span className="text-sm font-bold text-[#00ff88] px-3 py-1 bg-[#00ff88]/10 rounded-full">
                                          {match.schedule?.time ?? "—"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-white text-sm">
                                        {t2
                                          ? `${t2.player1Name} / ${t2.player2Name}`
                                          : "A definir"}
                                      </p>
                                    </div>
                                  </div>
                                  {match.schedule?.court && (
                                    <p className="text-center text-xs text-gray-500 mt-2">
                                      📍 {match.schedule.court}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)}

                  {(tournament.groups ?? []).every(
                    (g) =>
                      g.matches.filter((m) => {
                        const schedDate = m.schedule?.date
                          ? new Date(m.schedule.date).toDateString()
                          : null;
                        return (
                          schedDate === new Date().toDateString() ||
                          (!m.played && !schedDate)
                        );
                      }).length === 0,
                  ) && (
                    <div className="text-center py-20 text-gray-400">
                      <p className="text-xl font-bold mb-2">
                        Nenhuma partida hoje
                      </p>
                      <p className="text-gray-500 text-sm">
                        Os jogos de hoje aparecerão aqui quando começarem
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal de Inscrição */}
      {/* Payment Modal — task 3.2 */}
      {showPayment && tournament && (
        <PaymentModal
          teamId={paymentTeamId}
          tournamentId={id ?? ""}
          playerName={registerForm.player1Name}
          playerEmail={registerForm.player1Email}
          playerNumber={1}
          amount={tournament.priceFirstCategory ?? 0}
          isSuper8={isSuper8Tournament}
          tournamentName={tournament.name}
          category={registerForm.category}
          isFree={
            !tournament.priceFirstCategory ||
            tournament.priceFirstCategory === 0
          }
          onPaid={() => {
            setShowPayment(false);
            setRegisterSuccess(true);
          }}
          onClose={() => setShowPayment(false)}
        />
      )}

      {showRegisterForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#0d1236] border border-white/[0.12] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px] font-extrabold text-white tracking-tight">
                Inscrição no Torneio
              </h3>
              <button
                onClick={() => setShowRegisterForm(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {!isSuper8Tournament && (
              <div>
                <label className="block text-[12px] font-semibold text-gray-400 mb-1.5">
                  Categoria
                </label>
                <select
                  value={registerForm.category}
                  onChange={(e) =>
                    setRegisterForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#0a0e27] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="">Selecione a categoria</option>
                  {tournament.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              )}

              {/* Jogador 1 — pré-preenchido e bloqueado se atleta logado */}
              <div className="pt-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                  {isAthlete ? "Você (Jogador 1)" : "Jogador 1"}
                </p>
                {isAthlete ? (
                  <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <span className="text-[#00ff88] text-sm">✓</span>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {registerForm.player1Name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {registerForm.player1Email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      placeholder="Nome completo"
                      value={registerForm.player1Name}
                      onChange={(e) =>
                        setRegisterForm((p) => ({
                          ...p,
                          player1Name: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-[#0a0e1a] border border-white/[0.12] rounded-xl text-white text-sm outline-none focus:border-[#00ff88] focus:ring-[3px] focus:ring-[#00ff88]/10 transition-all placeholder:text-gray-600 mb-2"
                    />
                    <input
                      placeholder="Email"
                      type="email"
                      value={registerForm.player1Email}
                      onChange={(e) =>
                        setRegisterForm((p) => ({
                          ...p,
                          player1Email: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-[#0a0e1a] border border-white/[0.12] rounded-xl text-white text-sm outline-none focus:border-[#00ff88] focus:ring-[3px] focus:ring-[#00ff88]/10 transition-all placeholder:text-gray-600"
                    />
                  </>
                )}
              </div>

              {/* Jogador 2 — oculto para Super 8 */}
              {!isSuper8Tournament && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                  {isAthlete ? "Parceiro (Jogador 2)" : "Jogador 2"}
                </p>
                <input
                  placeholder="Nome completo"
                  value={registerForm.player2Name}
                  onChange={(e) =>
                    setRegisterForm((p) => ({
                      ...p,
                      player2Name: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#0a0e1a] border border-white/[0.12] rounded-xl text-white text-sm outline-none focus:border-[#00ff88] focus:ring-[3px] focus:ring-[#00ff88]/10 transition-all placeholder:text-gray-600 mb-2"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={registerForm.player2Email}
                  onChange={(e) =>
                    setRegisterForm((p) => ({
                      ...p,
                      player2Email: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#0a0e1a] border border-white/[0.12] rounded-xl text-white text-sm outline-none focus:border-[#00ff88] focus:ring-[3px] focus:ring-[#00ff88]/10 transition-all placeholder:text-gray-600"
                />
              </div>
              )}

              {registerError && (
                <p className="text-red-400 text-sm">{registerError}</p>
              )}

              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="reg-terms"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (registerError.includes("Termos")) setRegisterError("");
                  }}
                  className="mt-1 w-4 h-4 accent-[#00ff88] cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="reg-terms"
                  className="text-sm text-gray-400 cursor-pointer leading-relaxed"
                >
                  Li e aceito os{" "}
                  <a
                    href="/termos"
                    target="_blank"
                    className="text-[#00ff88] hover:underline"
                  >
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a
                    href="/privacidade"
                    target="_blank"
                    className="text-[#00ff88] hover:underline"
                  >
                    Política de Privacidade
                  </a>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRegisterForm(false)}
                  className="flex-1 py-2.5 border border-white/20 text-gray-300 rounded-lg text-sm hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegister}
                  disabled={registerLoading}
                  className="flex-1 py-2.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl font-extrabold text-sm hover:bg-[#00ff99] hover:shadow-[0_0_16px_rgba(0,255,136,0.3)] transition-all disabled:opacity-40 active:scale-[0.98]"
                >
                  {registerLoading ? "A enviar..." : "Confirmar Inscrição"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA Mobile Fixo ─────────────────────────────────────────────── */}
      {isOpen && (
        <div className={`fixed ${isAthlete ? "bottom-14" : "bottom-0"} left-0 right-0 z-40 md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3`}>
          {registerSuccess ? (
            <div className="w-full py-3 bg-green-600/20 border border-green-500/30 text-green-300 rounded-xl font-bold text-sm text-center">
              ✓ Inscrição realizada! Aguarde confirmação.
            </div>
          ) : isPendingPayment ? (
            <div className="w-full py-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl font-bold text-sm text-center">
              Inscrito — Aguardando Pagamento
            </div>
          ) : isClub ? (
            <div className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-bold text-sm text-center">
              Inscrição exclusiva para atletas
            </div>
          ) : !currentUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl font-extrabold text-[15px] hover:bg-[#00ff99] transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,136,0.25)]"
            >
              {`Inscrever-se — ${tournament.priceFirstCategory > 0 ? "R$ " + tournament.priceFirstCategory.toFixed(2).replace(".", ",") : "Grátis"}`}
            </button>
          ) : isAthlete ? (
            <button
              onClick={handleOpenRegister}
              className="w-full py-3.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl font-extrabold text-[15px] hover:bg-[#00ff99] transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,136,0.25)]"
            >
              {`Inscrever-se — ${tournament.priceFirstCategory > 0 ? "R$ " + tournament.priceFirstCategory.toFixed(2).replace(".", ",") : "Grátis"}`}
            </button>
          ) : null}
        </div>
      )}

      {/* Footer */}
      <footer className={`bg-[#0a0e27] border-t border-white/5 py-8 md:py-12 px-4 md:px-6 lg:px-8 mt-12 md:mt-20 ${isAthlete ? "pb-20" : ""} md:pb-12`}>
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2026 Bubble. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* ── Bottom Nav — Mobile Atleta ──────────────────────────────────────── */}
      {isAthlete && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe z-50">
          <div className="flex">
            <Link
              to="/athlete/dashboard"
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathname === "/athlete/dashboard" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
            >
              <span className="text-xl leading-none">🏠</span>Início
            </Link>
            <Link
              to="/tournaments"
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathname === "/tournaments" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
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
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${pathname === "/athlete/profile" ? "text-[#00e87a]" : "text-[#6b7a99]"}`}
            >
              <span className="text-xl leading-none">👤</span>Perfil
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentProfile;
