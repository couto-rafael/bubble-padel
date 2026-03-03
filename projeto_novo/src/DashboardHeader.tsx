import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// ── mock ──────────────────────────────────────────────────
const CLUB = {
  name: "São Paulo Padel Club",
  initials: "SP",
  email: "contato@sppadelclub.com.br",
};

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Nova dupla inscrita",
    desc: "Rafael Souza / Beatriz Alves – Primavera Open",
    time: "2h atrás",
    read: false,
  },
  {
    id: 2,
    title: "Pagamento confirmado",
    desc: "R$ 150,00 – Dupla 14",
    time: "3h atrás",
    read: false,
  },
  {
    id: 3,
    title: "Partida finalizada",
    desc: "Quadra 1 – 6-4, 6-3",
    time: "5h atrás",
    read: true,
  },
  {
    id: 4,
    title: "Torneio iniciou",
    desc: "League Semanal – Rodada 4",
    time: "1d atrás",
    read: true,
  },
];

interface DashboardHeaderProps {
  activePage?: "dashboard" | "tournaments" | "marketplace";
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activePage = "dashboard",
}) => {
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navDashOpen, setNavDashOpen] = useState(false);
  const [navTournOpen, setNavTournOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navDashRef = useRef<HTMLDivElement>(null);
  const navTournRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (navDashRef.current && !navDashRef.current.contains(e.target as Node))
        setNavDashOpen(false);
      if (
        navTournRef.current &&
        !navTournRef.current.contains(e.target as Node)
      )
        setNavTournOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div
          className="flex items-center justify-between"
          style={{ height: "4.5rem" }}
        >
          {/* left group: logo + nav */}
          <div className="flex items-center gap-6">
            {/* logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#0a0e27]"
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
              <span className="text-xl font-bold tracking-tight">Bubble</span>
            </Link>

            {/* nav */}
            <nav className="hidden md:flex items-center gap-1">
              {/* ── Dashboard dropdown ── */}
              <div className="relative" ref={navDashRef}>
                <button
                  onClick={() => {
                    setNavDashOpen((v) => !v);
                    setNavTournOpen(false);
                    setNotifOpen(false);
                    setDropOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activePage === "dashboard"
                      ? "bg-white/8 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Dashboard
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${navDashOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {navDashOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1f4a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {[
                      {
                        label: "Painel Clube",
                        to: "/dashboard",
                        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-6 0h6",
                      },
                      {
                        label: "Relatórios",
                        to: "/dashboard/reports",
                        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                      },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setNavDashOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Torneios dropdown ── */}
              <div className="relative" ref={navTournRef}>
                <button
                  onClick={() => {
                    setNavTournOpen((v) => !v);
                    setNavDashOpen(false);
                    setNotifOpen(false);
                    setDropOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activePage === "tournaments"
                      ? "bg-white/8 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Torneios
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${navTournOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {navTournOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1f4a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {[
                      {
                        label: "Criar Torneio",
                        to: "/dashboard/tournaments/create",
                        icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
                      },
                      {
                        label: "Meus Torneios",
                        to: "/dashboard/tournaments",
                        icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
                      },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setNavTournOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Marketplace (link simples) ── */}
              <Link
                to="/marketplace"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activePage === "marketplace"
                    ? "bg-white/8 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Marketplace
              </Link>
            </nav>
          </div>{" "}
          {/* end left group */}
          {/* right cluster */}
          <div className="flex items-center gap-2">
            {/* search btn */}
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setDropOpen(false);
                }}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* notification panel */}
              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1f4a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-sm">Notificações</h3>
                    <button className="text-xs text-[#00ff88] hover:text-[#00dd77] font-medium transition-colors">
                      Marcar todas como lidas
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-5 py-3.5 border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${!n.read ? "bg-[#00ff88]/4" : ""}`}
                      >
                        {/* dot */}
                        <div
                          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? "bg-[#00ff88]" : "bg-transparent"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${!n.read ? "font-semibold" : "font-medium text-gray-300"}`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {n.desc}
                          </p>
                        </div>
                        <span className="text-xs text-gray-600 flex-shrink-0 whitespace-nowrap">
                          {n.time}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 border-t border-white/10 text-center">
                    <button className="text-xs text-[#00ccff] hover:text-[#00aadd] font-medium transition-colors">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* profile dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => {
                  setDropOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {/* person icon */}
                <svg
                  className="w-5 h-5 text-gray-400"
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
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`}
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

              {/* dropdown */}
              {dropOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1f4a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                  {/* club summary */}
                  <div className="px-4 py-3.5 border-b border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0a0e27] text-xs font-bold">
                        {CLUB.initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{CLUB.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {CLUB.email}
                      </p>
                    </div>
                  </div>

                  {/* links */}
                  {[
                    {
                      label: "Perfil do Clube",
                      to: "/dashboard/profile",
                      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                    },
                    {
                      label: "Configurações",
                      to: "/dashboard/settings",
                      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                    },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                      {item.label}
                    </Link>
                  ))}

                  {/* logout */}
                  <div className="border-t border-white/10 mt-1">
                    <button
                      onClick={() => {
                        setDropOpen(false);
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
