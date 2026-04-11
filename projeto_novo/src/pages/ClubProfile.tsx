import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicClubService, type PublicClub } from "../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStatus(s: string) {
  switch (s.toUpperCase()) {
    case "OPEN":
      return "Aberto";
    case "PUBLISHED":
      return "Em Breve";
    case "ONGOING":
      return "Em Andamento";
    case "COMPLETED":
      return "Finalizado";
    default:
      return s;
  }
}

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
      return s ?? "";
  }
}

function sportIcon(s: string) {
  switch (s.toUpperCase()) {
    case "PADEL":
      return "🎾";
    case "BEACH_TENNIS":
      return "🏖️";
    case "TENIS":
      return "🎾";
    case "PICKLEBALL":
      return "🏓";
    default:
      return "🏅";
  }
}

function formatDate(d: string) {
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
  const s = new Date(d.slice(0, 10) + "T12:00:00");
  const e = d.length > 10 ? new Date(d) : s; // reuse if single date
  return `${s.getDate()} ${months[s.getMonth()]}`;
}

function formatDateRange(start: string, end: string) {
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
  const s = new Date(start.slice(0, 10) + "T12:00:00");
  const e = new Date(end.slice(0, 10) + "T12:00:00");
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${months[s.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]}`;
}

const STATUS_COLORS: Record<string, string> = {
  Aberto: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20",
  "Em Breve": "bg-blue-500/20 text-blue-300 border border-blue-500/20",
  "Em Andamento":
    "bg-purple-500/20 text-purple-300 border border-purple-500/20",
  Finalizado: "bg-white/10 text-gray-400 border border-white/10",
};

const AMENITY_ICONS: Record<string, string> = {
  estacionamento: "🚗",
  bar: "🍺",
  restaurante: "🍽️",
  vestiarios: "🚿",
  salaoFestas: "🎉",
  churrasqueira: "🔥",
  academia: "💪",
  loja: "🛒",
  piscina: "🏊",
  areaKids: "🧒",
  wifi: "📶",
  arquibancada: "🏟️",
  iluminacao: "💡",
  cameras: "📷",
};
const AMENITY_LABELS: Record<string, string> = {
  estacionamento: "Estacionamento",
  bar: "Bar",
  restaurante: "Restaurante",
  vestiarios: "Vestiários",
  salaoFestas: "Salão de Festas",
  churrasqueira: "Churrasqueira",
  academia: "Academia",
  loja: "Pro Shop",
  piscina: "Piscina",
  areaKids: "Área Kids",
  wifi: "Wi-Fi",
  arquibancada: "Arquibancada",
  iluminacao: "Ilum. Noturna",
  cameras: "Câmeras",
};
const WEEKDAY_LABELS: [string, string][] = [
  ["seg", "Segunda"],
  ["ter", "Terça"],
  ["qua", "Quarta"],
  ["qui", "Quinta"],
  ["sex", "Sexta"],
  ["sab", "Sábado"],
  ["dom", "Domingo"],
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClubProfile() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<PublicClub | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "open" | "ongoing" | "completed"
  >("all");
  const [copied, setCopied] = useState(false);
  const tourneiosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    PublicClubService.get(id)
      .then(setClub)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({ title: club?.name ?? "Clube", url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <header className="h-16 bg-[#0a0e1a]/95 border-b border-white/[0.07] sticky top-0 z-50" />
        <div className="h-52 bg-white/5 animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 -mt-10 pb-12 animate-pulse">
          <div className="flex items-end gap-5 mb-8">
            <div className="w-24 h-24 rounded-2xl bg-white/10 border-4 border-[#0a0e1a] flex-shrink-0" />
            <div className="pb-2 space-y-2 flex-1">
              <div className="h-7 bg-white/10 rounded-xl w-48" />
              <div className="h-4 bg-white/5 rounded-lg w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-center px-4">
        <div>
          <span className="text-5xl block mb-4">🏟️</span>
          <h1 className="text-2xl font-black text-white mb-2">
            Clube não encontrado
          </h1>
          <p className="text-gray-400 mb-6">
            O link pode estar incorreto ou o clube foi removido.
          </p>
          <Link
            to="/tournaments"
            className="px-6 py-3 bg-[#00ff88] text-[#0a0e1a] rounded-xl font-extrabold hover:bg-[#00ff99] transition-colors"
          >
            Ver Torneios
          </Link>
        </div>
      </div>
    );
  }

  // ── Derivações ────────────────────────────────────────────────────────────────
  const c = club as any;
  const location = [club.city, club.state].filter(Boolean).join(", ") || "";
  const courtsCount = club.courts?.length ?? 0;
  const amenities: string[] = c.amenities ?? [];
  const clubSports: string[] = c.sports ?? [];
  const businessHours: Record<string, string> = c.businessHours ?? {};
  const instructors: any[] = c.instructors ?? [];
  const description: string = c.description ?? "";
  const slogan: string = c.slogan ?? "";
  const coverUrl: string = c.coverUrl ?? "";
  const whatsapp: string = c.whatsappNumber ?? club.phone ?? "";
  const instagram: string = c.instagramUrl ?? "";
  const youtube: string = c.youtubeUrl ?? "";
  const twitter: string = c.twitterUrl ?? "";
  const threads: string = c.threadsUrl ?? "";

  const hasBusinessHours = Object.values(businessHours).some((v) => v);
  const openTournaments = club.tournaments.filter((t) =>
    ["OPEN", "PUBLISHED"].includes(t.status.toUpperCase()),
  );
  const hasOpenTournaments = openTournaments.length > 0;

  const filteredTournaments = club.tournaments.filter((t) => {
    if (filter === "all") return true;
    if (filter === "open")
      return ["OPEN", "PUBLISHED"].includes(t.status.toUpperCase());
    if (filter === "ongoing") return t.status.toUpperCase() === "ONGOING";
    if (filter === "completed") return t.status.toUpperCase() === "COMPLETED";
    return true;
  });

  const socialLinks = [
    instagram && {
      href: instagram,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      label: "Instagram",
    },
    youtube && {
      href: youtube,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      label: "YouTube",
    },
    twitter && {
      href: twitter,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      label: "Twitter/X",
    },
    threads && {
      href: threads,
      icon: (
        <svg viewBox="0 0 192 192" className="w-5 h-5" fill="currentColor">
          <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.861 14.05-7.327-1.244-15.224-1.626-23.62-1.141-23.778 1.368-39.098 15.263-38.155 34.568.482 9.777 5.42 18.206 13.929 23.728 7.177 4.709 16.42 7.015 26.002 6.49 12.683-.694 22.647-5.542 29.578-14.395 5.607-7.105 9.044-16.258 10.489-27.798 6.287 3.792 10.942 8.813 13.492 14.93 4.482 10.71 4.748 28.303-9.382 42.397-12.453 12.422-27.442 17.787-50.074 17.952-25.076-.185-44.028-8.236-56.321-23.937C13.594 134.635 7.81 116.529 7.584 94c.226-22.53 6.01-40.635 17.2-53.784 12.294-15.7 31.246-23.75 56.322-23.936 25.245.186 44.556 8.275 57.37 24.034 6.299 7.82 10.944 17.676 13.902 29.289l16.195-4.325c-3.61-13.879-9.56-25.915-17.795-35.907C134.773 11.403 111.846 1.202 82.107 1H81.9C52.161 1.202 29.427 11.403 15.573 29.376 3.301 45.33-2.909 67.262-3 94c.091 26.738 6.301 48.669 18.573 64.624C29.427 176.597 52.161 186.798 81.9 187h.207c26.96-.187 46.21-7.267 61.99-23.003 21.317-21.264 20.657-47.976 13.419-64.332-5.013-11.977-14.843-21.733-27.98-27.677z" />
        </svg>
      ),
      label: "Threads",
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: JSX.Element;
    label: string;
  }>;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.07] bg-[#0a0e1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00ff88] rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#0a0e1a]"
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
            <span className="text-[17px] font-extrabold tracking-tight">
              Bubble
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/tournaments"
              className="hidden sm:block text-[13px] text-gray-400 hover:text-white transition-colors"
            >
              ← Torneios
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.08] hover:bg-white/15 rounded-xl text-[13px] font-bold transition-colors border border-white/[0.08]"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {copied ? "✓ Copiado!" : "Compartilhar"}
            </button>
          </div>
        </div>
      </header>

      {/* ── CAPA ─────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-48 sm:h-64 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Capa"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0d1230] via-[#0f1844] to-[#0a0e1a]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(0,255,136,0.08),transparent_60%)]" />
          </div>
        )}
      </div>

      {/* ── IDENTIDADE ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative -mt-12 mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Logo sobreposto à capa */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[#0a0e1a] bg-white/5 flex-shrink-0 flex items-center justify-center">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-gray-500">
                {club.name?.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Nome, slogan, localização */}
          <div className="flex-1 pb-1">
            <h1 className="text-[28px] sm:text-[36px] font-black tracking-tight leading-tight">
              {club.name}
            </h1>
            {slogan && (
              <p className="text-[14px] text-gray-400 mt-0.5">{slogan}</p>
            )}
            {location && (
              <p className="text-[13px] text-gray-500 mt-1 flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {location}
              </p>
            )}
          </div>
        </div>

        {/* Esportes + redes sociais + status torneio */}
        <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-white/[0.07]">
          {/* Sport badges */}
          {clubSports.map((s) => (
            <span
              key={s}
              className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-full text-[12px] font-bold"
            >
              {sportIcon(s)} {normalizeSport(s)}
            </span>
          ))}

          {/* Separador */}
          {clubSports.length > 0 && socialLinks.length > 0 && (
            <span className="text-white/10">|</span>
          )}

          {/* Redes sociais */}
          {socialLinks.map(({ href, icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/[0.08] text-gray-400 hover:text-white transition-colors"
            >
              {icon}
            </a>
          ))}

          {/* Status torneio — âncora */}
          <button
            onClick={() =>
              tourneiosRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className={`ml-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
              hasOpenTournaments
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-white/5 text-gray-500 border-white/10"
            }`}
          >
            {hasOpenTournaments ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {openTournaments.length}{" "}
                {openTournaments.length === 1 ? "torneio" : "torneios"} com
                inscrições abertas
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                Sem inscrições abertas
              </>
            )}
          </button>
        </div>

        {/* ── GRID 2 COLUNAS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          {/* ── COLUNA PRINCIPAL (2/3) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sobre */}
            {description && (
              <section>
                <h2 className="text-[15px] font-extrabold tracking-tight mb-3">
                  Sobre
                </h2>
                <p className="text-[14px] text-gray-300 leading-relaxed">
                  {description}
                </p>
              </section>
            )}

            {/* Estrutura & Comodidades */}
            {(courtsCount > 0 ||
              amenities.length > 0 ||
              clubSports.length > 0) && (
              <section>
                <h2 className="text-[15px] font-extrabold tracking-tight mb-4">
                  Estrutura
                </h2>
                <div className="space-y-4">
                  {/* Quadras */}
                  {courtsCount > 0 && (
                    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        🏟️ Quadras
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {club.courts!.map((court, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-[13px] font-semibold text-gray-200"
                          >
                            {court}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                        ✨ Comodidades
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                        {amenities.map((key) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-[13px] text-gray-300"
                          >
                            <span className="text-base">
                              {AMENITY_ICONS[key] ?? "✓"}
                            </span>
                            <span>{AMENITY_LABELS[key] ?? key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Professores */}
            {instructors.length > 0 && (
              <section>
                <h2 className="text-[15px] font-extrabold tracking-tight mb-4">
                  Professores
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {instructors.map((inst: any) => (
                    <div
                      key={inst.id}
                      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-start gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 border border-white/10 flex items-center justify-center">
                        {inst.photoUrl ? (
                          <img
                            src={inst.photoUrl}
                            alt={inst.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-black text-[#00ff88]">
                            {inst.name?.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-[14px]">
                          {inst.name}
                        </p>
                        {inst.sports?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                            {inst.sports.map((s: string) => (
                              <span
                                key={s}
                                className="text-[10px] font-bold px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] rounded-full"
                              >
                                {normalizeSport(s)}
                              </span>
                            ))}
                          </div>
                        )}
                        {inst.bio && (
                          <p className="text-[12px] text-gray-400 line-clamp-2 leading-relaxed">
                            {inst.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Torneios */}
            <section ref={tourneiosRef}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-[15px] font-extrabold tracking-tight">
                  Torneios
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "open", "ongoing", "completed"] as const).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                          filter === f
                            ? "bg-[#00ff88] text-[#0a0e1a] border-[#00ff88]"
                            : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {f === "all"
                          ? "Todos"
                          : f === "open"
                            ? "Abertos"
                            : f === "ongoing"
                              ? "Em And."
                              : "Concluídos"}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {filteredTournaments.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-gray-600">
                  <span className="text-3xl mb-2 opacity-40">🎾</span>
                  <p className="text-sm font-semibold text-gray-500">
                    Nenhum torneio nesta categoria
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTournaments.map((t) => {
                    const statusLabel = normalizeStatus(t.status);
                    const statusCls =
                      STATUS_COLORS[statusLabel] ??
                      "bg-white/10 text-gray-400 border border-white/10";
                    const isOpen = t.status.toUpperCase() === "OPEN";
                    return (
                      <Link
                        key={t.id}
                        to={`/tournaments/${t.id}`}
                        className="group flex items-center justify-between gap-4 bg-white/[0.03] border border-white/[0.06] hover:border-[#00ff88]/30 hover:bg-white/[0.05] rounded-xl px-4 py-3.5 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}
                            >
                              {statusLabel}
                            </span>
                            <span className="text-[11px] text-gray-600">
                              {normalizeSport(t.sport)}
                            </span>
                          </div>
                          <p className="font-extrabold text-[14px] tracking-tight group-hover:text-[#00ff88] transition-colors truncate">
                            {t.name}
                          </p>
                          <p className="text-[12px] text-gray-600 mt-0.5">
                            {formatDateRange(t.startDate, t.endDate)} ·{" "}
                            {t._count.teams} duplas
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isOpen && (
                            <span className="hidden sm:block px-3 py-1.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl text-[11px] font-extrabold">
                              Inscrever-se
                            </span>
                          )}
                          <svg
                            className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors"
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
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Feed placeholder */}
            <section>
              <h2 className="text-[15px] font-extrabold tracking-tight mb-4">
                Fotos & Feed
              </h2>
              <div className="bg-white/[0.03] border border-dashed border-white/[0.07] rounded-2xl p-10 text-center">
                <span className="text-3xl block mb-2 opacity-20">📸</span>
                <p className="text-[13px] font-bold text-gray-700 mb-1">
                  Em breve
                </p>
                <p className="text-[12px] text-gray-800">
                  Fotos e atualizações do clube aparecerão aqui.
                </p>
              </div>
            </section>
          </div>

          {/* ── SIDEBAR (1/3) ──────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Torneios abertos — CTA rápido */}
            {hasOpenTournaments && (
              <div className="bg-white/[0.04] border border-[#00ff88]/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                  <p className="text-[13px] font-extrabold text-[#00ff88]">
                    Inscrições Abertas
                  </p>
                </div>
                <div className="space-y-3">
                  {openTournaments.slice(0, 3).map((t) => (
                    <Link
                      key={t.id}
                      to={`/tournaments/${t.id}`}
                      className="group block bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl p-3 transition-all"
                    >
                      <p className="font-extrabold text-[13px] tracking-tight group-hover:text-[#00ff88] transition-colors line-clamp-1">
                        {t.name}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {formatDateRange(t.startDate, t.endDate)}
                      </p>
                      <div className="mt-2 w-full py-1.5 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-[11px] font-extrabold text-center group-hover:bg-[#00ff99] transition-colors">
                        Inscrever-se →
                      </div>
                    </Link>
                  ))}
                  {openTournaments.length > 3 && (
                    <button
                      onClick={() => {
                        setFilter("open");
                        tourneiosRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }}
                      className="w-full text-center text-[12px] text-gray-500 hover:text-white py-1 transition-colors"
                    >
                      Ver todos ({openTournaments.length}) →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Contato */}
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 space-y-4">
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                Contato
              </p>

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">WhatsApp</p>
                    <p className="text-[13px] font-semibold text-white group-hover:text-[#00ff88] transition-colors">
                      {club.phone || whatsapp}
                    </p>
                  </div>
                </a>
              )}

              {location && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Localização</p>
                    <p className="text-[13px] font-semibold text-white">
                      {location}
                    </p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors mt-0.5 inline-block"
                    >
                      Ver no Google Maps →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Horários */}
            {hasBusinessHours && (
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  🕐 Horários
                </p>
                <div className="space-y-1.5">
                  {WEEKDAY_LABELS.map(([key, label]) => {
                    const hours = businessHours[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <span className="text-gray-500 font-medium">
                          {label}
                        </span>
                        <span
                          className={
                            hours
                              ? "font-semibold text-gray-200"
                              : "text-gray-700"
                          }
                        >
                          {hours || "Fechado"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Redes sociais verticais (se houver) */}
            {socialLinks.length > 0 && (
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Redes Sociais
                </p>
                <div className="space-y-2">
                  {socialLinks.map(({ href, icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-colors">
                        {icon}
                      </div>
                      <span className="text-[13px] font-semibold">{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile CTA WhatsApp fixo ──────────────────────────────────────── */}
      {whatsapp && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.07]">
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-extrabold text-[15px] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Falar no WhatsApp
          </a>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-6 px-6 mt-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#00ff88] rounded flex items-center justify-center">
              <svg
                className="w-3 h-3 text-[#0a0e1a]"
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
            <span className="font-extrabold text-white text-[13px]">
              Bubble
            </span>
          </Link>
          <p>
            © {new Date().getFullYear()} Bubble. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
