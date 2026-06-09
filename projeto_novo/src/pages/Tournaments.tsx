import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AthleteBottomNav from "../components/AthleteBottomNav";
import AuthModal from "../components/AuthModal";
import MobileMenu from "../components/MobileMenu";
import AthleteHeader from "../components/AthleteHeader";
import SEOHead from "../components/SEOHead";
import { useAuth } from "../contexts/AuthContext";
import {
  PublicTournamentService,
  type PublicTournament,
} from "../services/api";

interface Tournament {
  id: string;
  name: string;
  club: string;
  city: string;
  state: string;
  dateRange: string;
  status:
    | "Inscrições Abertas"
    | "Em Breve"
    | "Inscrições Encerradas"
    | "Em Andamento"
    | "Finalizado";
  sport: string;
  teams: number;
  tournamentType: string;
}

function normalizeSport(sport: string): string {
  const map: Record<string, string> = {
    PADEL: "Padel",
    BEACH_TENNIS: "Beach Tennis",
    TENIS: "Tênis",
    PICKLEBALL: "Pickleball",
  };
  return map[sport] ?? sport;
}

function normalizeStatus(status: string): Tournament["status"] {
  const map: Record<string, Tournament["status"]> = {
    draft: "Em Breve",
    published: "Em Breve", // publicado, inscrições não abertas ainda
    open: "Inscrições Abertas",
    closed: "Inscrições Encerradas", // ← novo
    ongoing: "Em Andamento",
    completed: "Finalizado",
  };
  return map[status.toLowerCase()] ?? "Em Breve";
}

function formatDateRange(start: string, end: string): string {
  // T12:00:00 evita bug de fuso horário UTC-3 Brasil
  const s = new Date(start.slice(0, 10) + "T12:00:00");
  const e = new Date(end.slice(0, 10) + "T12:00:00");
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${months[s.getMonth()]}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]}–${e.getDate()} ${months[e.getMonth()]}`;
}

function mapPublicTournament(t: PublicTournament): Tournament {
  return {
    id: t.id,
    name: t.name,
    club: t.club?.name ?? "—",
    city: t.club?.city ?? "—",
    state: t.club?.state ?? "—",
    dateRange: formatDateRange(t.startDate, t.endDate),
    status: normalizeStatus(t.status),
    sport: normalizeSport(t.sport),
    teams: t._count?.teams ?? t.totalTeams ?? 0,
    tournamentType: (t as any).tournamentType ?? "Regular (Grupo + Playoffs)",
  };
}

const Tournaments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser, logout } = useAuth();
  const isAthlete = currentUser?.type?.toUpperCase() === "ATHLETE";
  const isClub = currentUser?.type?.toUpperCase() === "CLUB";
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sportFilters, setSportFilters] = useState<string[]>([]);
  const [stateFilters, setStateFilters] = useState<string[]>([]);
  const [cityFilters, setCityFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>(() => {
    const f = searchParams.get("filter");
    if (f === "abertos") return ["Inscrições Abertas"];
    if (f === "encerrados") return ["Finalizado"];
    return [];
  });
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  useEffect(() => {
    PublicTournamentService.list()
      .then((data) => setAllTournaments(data.map(mapPublicTournament)))
      .catch(() => setAllTournaments([]))
      .finally(() => setLoadingTournaments(false));
  }, []);

  // Get unique states and cities from tournaments
  const uniqueStates = Array.from(
    new Set(allTournaments.map((t) => t.state)),
  ).sort();
  const uniqueCities = Array.from(
    new Set(allTournaments.map((t) => t.city)),
  ).sort();
  const uniqueSports = Array.from(
    new Set(allTournaments.map((t) => t.sport)),
  ).sort();
  const uniqueStatuses: Tournament["status"][] = [
    "Inscrições Abertas",
    "Em Breve",
    "Inscrições Encerradas",
    "Em Andamento",
    "Finalizado",
  ];

  const toggleFilter = (
    filterArray: string[],
    setFilter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter((item) => item !== value));
    } else {
      if (filterArray.length < 2) {
        setFilter([...filterArray, value]);
      }
    }
  };

  const filteredTournaments = allTournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilters.length === 0 || statusFilters.includes(tournament.status);
    const matchesState =
      stateFilters.length === 0 || stateFilters.includes(tournament.state);
    const matchesCity =
      cityFilters.length === 0 || cityFilters.includes(tournament.city);
    const matchesSport =
      sportFilters.length === 0 || sportFilters.includes(tournament.sport);
    const matchesType =
      typeFilters.length === 0 || typeFilters.includes(tournament.tournamentType);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesState &&
      matchesCity &&
      matchesSport &&
      matchesType
    );
  });

  const getFilterLabel = (filterArray: string[], defaultText: string) => {
    if (filterArray.length === 0) return defaultText;
    if (filterArray.length === 1) return filterArray[0];
    return `${filterArray[0]} +1`;
  };

  const getStatusColor = (status: Tournament["status"]) => {
    switch (status) {
      case "Inscrições Abertas":
        return "bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30";
      case "Em Breve":
        return "bg-[#00ccff]/20 text-[#00ccff] border-[#00ccff]/30";
      case "Inscrições Encerradas":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Em Andamento":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Finalizado":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeLabel = (type: string): string => {
    if (type === "Super 8") return "Super 8";
    if (type === "Eliminatorias Diretas") return "Eliminatórias";
    return "Grupos + Playoffs";
  };

  const getTypeColor = (type: string): string => {
    if (type === "Super 8") return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    if (type === "Eliminatorias Diretas") return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    return "bg-teal-500/20 text-teal-300 border-teal-500/30";
  };

  const getSportColor = (sport: Tournament["sport"]) => {
    switch (sport) {
      case "Padel":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Beach Tennis":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Tênis":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Pickleball":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      <SEOHead
        title="Torneios de Padel e Beach Tennis"
        description="Encontre e inscreva-se nos melhores torneios de padel e beach tennis do Brasil. Organize seu próximo torneio no Bubble Padel."
        url="https://bubblepadel.com/tournaments"
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Navigation */}
      {isAthlete ? (
        <AthleteHeader />
      ) : (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/95 backdrop-blur-sm border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#0a0e1a]"
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

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
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
                    className="px-6 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all"
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
                  className="px-6 py-2.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl font-bold text-sm hover:bg-[#00ff99] transition-all"
                >
                  Entrar
                </button>
              )}
            </div>

            {/* Mobile Menu */}
            <MobileMenu onLoginClick={() => setIsAuthModalOpen(true)} currentUser={currentUser as any} />
          </div>
        </div>
      </nav>
      )}

      {/* Page Header */}
      <section className="pt-24 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            Torneios
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Explore os torneios de padel disponíveis na plataforma
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="pb-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] overflow-hidden">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="lg:hidden w-full p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
            >
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-semibold">
                  Filtros
                  {sportFilters.length +
                    stateFilters.length +
                    cityFilters.length +
                    statusFilters.length >
                    0 && (
                    <span className="ml-2 px-2 py-0.5 bg-[#00ff88] text-[#0a0e1a] rounded-full text-xs font-bold">
                      {sportFilters.length +
                        stateFilters.length +
                        cityFilters.length +
                        statusFilters.length}
                    </span>
                  )}
                </span>
              </div>
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

            {/* Filter Content */}
            <div
              className={`p-6 ${filtersExpanded ? "block" : "hidden lg:block"}`}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Search - Collapsible */}
                <div
                  className={`transition-all duration-300 ${searchExpanded ? "col-span-2 md:col-span-3 lg:col-span-2" : "col-span-1"}`}
                >
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
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
                      placeholder={
                        searchExpanded
                          ? "Buscar torneio, clube ou cidade…"
                          : "Buscar…"
                      }
                      value={searchQuery}
                      onFocus={() => setSearchExpanded(true)}
                      onBlur={() => {
                        if (searchQuery === "") setSearchExpanded(false);
                      }}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0e1a] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Sport Filter */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) =>
                      toggleFilter(
                        sportFilters,
                        setSportFilters,
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {getFilterLabel(sportFilters, "Esporte")}
                    </option>
                    {uniqueSports.map((sport) => (
                      <option
                        key={sport}
                        value={sport}
                        disabled={
                          sportFilters.length >= 2 &&
                          !sportFilters.includes(sport)
                        }
                      >
                        {sport} {sportFilters.includes(sport) ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                  {sportFilters.length > 0 && (
                    <button
                      onClick={() => setSportFilters([])}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                  )}
                </div>

                {/* State Filter */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) =>
                      toggleFilter(
                        stateFilters,
                        setStateFilters,
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {getFilterLabel(stateFilters, "Estado")}
                    </option>
                    {uniqueStates.map((state) => (
                      <option
                        key={state}
                        value={state}
                        disabled={
                          stateFilters.length >= 2 &&
                          !stateFilters.includes(state)
                        }
                      >
                        {state} {stateFilters.includes(state) ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                  {stateFilters.length > 0 && (
                    <button
                      onClick={() => setStateFilters([])}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                  )}
                </div>

                {/* City Filter */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) =>
                      toggleFilter(cityFilters, setCityFilters, e.target.value)
                    }
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {getFilterLabel(cityFilters, "Cidade")}
                    </option>
                    {uniqueCities.map((city) => (
                      <option
                        key={city}
                        value={city}
                        disabled={
                          cityFilters.length >= 2 && !cityFilters.includes(city)
                        }
                      >
                        {city} {cityFilters.includes(city) ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                  {cityFilters.length > 0 && (
                    <button
                      onClick={() => setCityFilters([])}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) =>
                      toggleFilter(
                        statusFilters,
                        setStatusFilters,
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {getFilterLabel(statusFilters, "Status")}
                    </option>
                    {uniqueStatuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                        disabled={
                          statusFilters.length >= 2 &&
                          !statusFilters.includes(status)
                        }
                      >
                        {status} {statusFilters.includes(status) ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                  {statusFilters.length > 0 && (
                    <button
                      onClick={() => setStatusFilters([])}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                  )}
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) =>
                      toggleFilter(
                        typeFilters,
                        setTypeFilters,
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {getFilterLabel(typeFilters, "Tipo")}
                    </option>
                    {["Regular (Grupo + Playoffs)", "Eliminatorias Diretas", "Super 8"].map((type) => (
                      <option
                        key={type}
                        value={type}
                        disabled={
                          typeFilters.length >= 2 &&
                          !typeFilters.includes(type)
                        }
                      >
                        {type} {typeFilters.includes(type) ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                  {typeFilters.length > 0 && (
                    <button
                      onClick={() => setTypeFilters([])}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                  )}
                </div>
              </div>

              {/* Active Filters Display */}
              {(sportFilters.length > 0 ||
                stateFilters.length > 0 ||
                cityFilters.length > 0 ||
                statusFilters.length > 0 ||
                typeFilters.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {sportFilters.map((sport) => (
                    <span
                      key={sport}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                    >
                      {sport}
                      <button
                        onClick={() =>
                          toggleFilter(sportFilters, setSportFilters, sport)
                        }
                        className="hover:text-white"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                  {stateFilters.map((state) => (
                    <span
                      key={state}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                    >
                      {state}
                      <button
                        onClick={() =>
                          toggleFilter(stateFilters, setStateFilters, state)
                        }
                        className="hover:text-white"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                  {cityFilters.map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30"
                    >
                      {city}
                      <button
                        onClick={() =>
                          toggleFilter(cityFilters, setCityFilters, city)
                        }
                        className="hover:text-white"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                  {statusFilters.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm border border-amber-500/30"
                    >
                      {status}
                      <button
                        onClick={() =>
                          toggleFilter(statusFilters, setStatusFilters, status)
                        }
                        className="hover:text-white"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                  {typeFilters.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm border border-cyan-500/30"
                    >
                      {type}
                      <button
                        onClick={() =>
                          toggleFilter(typeFilters, setTypeFilters, type)
                        }
                        className="hover:text-white"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      setSportFilters([]);
                      setStateFilters([]);
                      setCityFilters([]);
                      setStatusFilters([]);
                      setTypeFilters([]);
                    }}
                    className="px-3 py-1 text-gray-400 hover:text-white text-sm"
                  >
                    Limpar todos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Grid */}
      <section className="pb-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loadingTournaments ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">A carregar torneios...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Nenhum torneio encontrado
              </h3>
              <p className="text-gray-400">
                Tente ajustar seus filtros ou volte mais tarde.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                  className="cursor-pointer group bg-white/[0.04] p-6 rounded-xl border border-white/[0.08] hover:border-[#00ff88]/30 transition-all hover:scale-[1.02]"
                >
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tournament.status)}`}
                    >
                      {tournament.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSportColor(tournament.sport)}`}
                    >
                      {tournament.sport}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(tournament.tournamentType)}`}
                    >
                      {getTypeLabel(tournament.tournamentType)}
                    </span>
                  </div>

                  {/* Tournament Info */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[#00ff88] transition-colors">
                    {tournament.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
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
                      <span className="truncate">{tournament.club}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
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
                        {tournament.city}/{tournament.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
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
                      <span>{tournament.dateRange}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
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
                        {tournament.teams}{" "}
                        {tournament.tournamentType === "Super 8" ? "inscritos" : "duplas inscritas"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/tournaments/${tournament.id}?tab=participants`,
                        );
                      }}
                      className="py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-all border border-white/[0.08] hover:border-white/20"
                    >
                      Inscritos
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tournaments/${tournament.id}?tab=info`);
                      }}
                      className="py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-all border border-white/[0.08] hover:border-white/20"
                    >
                      Informações
                    </button>
                  </div>

                  {/* Main CTA Button */}
                  {tournament.status === "Inscrições Abertas" && isClub ? (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-3 bg-white/5 border border-white/[0.08] text-gray-400 rounded-xl font-bold cursor-not-allowed"
                    >
                      Inscrição exclusiva para atletas
                    </button>
                  ) : tournament.status === "Inscrições Abertas" &&
                    !currentUser ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e1a] rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg"
                    >
                      Inscrever-se
                    </button>
                  ) : tournament.status === "Inscrições Abertas" &&
                    isAthlete ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tournaments/${tournament.id}?register=true`);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e1a] rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg"
                    >
                      Inscrever-se
                    </button>
                  ) : tournament.status === "Inscrições Encerradas" ? (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold cursor-default"
                    >
                      Inscrições Encerradas
                    </button>
                  ) : tournament.status === "Em Breve" ? (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-3 bg-white/5 border border-white/[0.08] text-gray-400 rounded-xl font-bold cursor-default"
                    >
                      Inscrições Em Breve
                    </button>
                  ) : tournament.status === "Em Andamento" ? (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-3 bg-white/5 border border-white/[0.08] text-gray-400 rounded-xl font-bold cursor-default"
                    >
                      Torneio em Andamento
                    </button>
                  ) : (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-3 bg-white/5 border border-white/[0.08] text-gray-400 rounded-xl font-bold cursor-default"
                    >
                      Torneio Finalizado
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {isAthlete && <AthleteBottomNav />}
    </div>
  );
};

export default Tournaments;
