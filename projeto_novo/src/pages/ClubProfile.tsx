import { useState, useEffect } from "react";
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

const WEEKDAY_LABELS: Record<string, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
};

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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    PublicClubService.get(id)
      .then(setClub)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: club?.name ?? "Clube", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <header className="border-b border-white/[0.07] h-16 bg-[#0a0e1a]/95 sticky top-0 z-50" />
        <div className="max-w-5xl mx-auto px-6 py-12 animate-pulse space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-7 bg-white/5 rounded-xl w-56" />
              <div className="h-4 bg-white/5 rounded-lg w-36" />
              <div className="flex gap-2">
                <div className="h-7 bg-white/5 rounded-full w-20" />
                <div className="h-7 bg-white/5 rounded-full w-20" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────────
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
  const location = [club.city, club.state].filter(Boolean).join(", ") || "—";
  const courtsCount = club.courts?.length ?? 0;
  const totalTournaments = club.tournaments.length;
  const activeTournaments = club.tournaments.filter((t) =>
    ["OPEN", "ONGOING", "PUBLISHED"].includes(t.status.toUpperCase()),
  ).length;
  const completedTournaments = club.tournaments.filter(
    (t) => t.status.toUpperCase() === "COMPLETED",
  ).length;
  const openTournaments = club.tournaments.filter((t) =>
    ["OPEN", "PUBLISHED"].includes(t.status.toUpperCase()),
  );
  const filteredTournaments = club.tournaments.filter((t) => {
    if (filter === "all") return true;
    if (filter === "open")
      return ["OPEN", "PUBLISHED"].includes(t.status.toUpperCase());
    if (filter === "ongoing") return t.status.toUpperCase() === "ONGOING";
    if (filter === "completed") return t.status.toUpperCase() === "COMPLETED";
    return true;
  });

  const amenities: string[] = (club as any).amenities ?? [];
  const clubSports: string[] = (club as any).sports ?? [];
  const businessHours: Record<string, string> =
    (club as any).businessHours ?? {};
  const instructors: any[] = (club as any).instructors ?? [];
  const description: string = (club as any).description ?? "";
  const hasBusinessHours = Object.values(businessHours).some((v) => v);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.07] bg-[#0a0e1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
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
              className="text-[13px] text-gray-400 hover:text-white transition-colors hidden sm:block"
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

      <main className="max-w-5xl mx-auto px-6 pb-24">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="py-10 border-b border-white/[0.07]">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/[0.08] flex-shrink-0 flex items-center justify-center">
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

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-[32px] sm:text-[40px] font-black tracking-tight leading-tight mb-2">
                {club.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-400 mb-4">
                {location !== "—" && (
                  <span className="flex items-center gap-1.5">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {location}
                  </span>
                )}
              </div>

              {/* Sport badges */}
              {clubSports.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {clubSports.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-full text-[12px] font-bold"
                    >
                      {sportIcon(s)} {normalizeSport(s)}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6">
                <div>
                  <p className="text-[22px] font-black leading-none text-white">
                    {totalTournaments}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Torneios</p>
                </div>
                <div>
                  <p className="text-[22px] font-black leading-none text-[#00ff88]">
                    {activeTournaments}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Ativos</p>
                </div>
                <div>
                  <p className="text-[22px] font-black leading-none text-gray-300">
                    {completedTournaments}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Concluídos</p>
                </div>
                {courtsCount > 0 && (
                  <div>
                    <p className="text-[22px] font-black leading-none text-[#00ccff]">
                      {courtsCount}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Quadras</p>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp CTA desktop */}
            {club.phone && (
              <a
                href={`https://wa.me/${club.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors flex-shrink-0"
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
            )}
          </div>
        </section>

        {/* ── TORNEIOS ABERTOS ─────────────────────────────────────────────── */}
        {openTournaments.length > 0 && (
          <section className="py-8 border-b border-white/[0.07]">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              <h2 className="text-[16px] font-extrabold tracking-tight">
                Inscrições Abertas
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {openTournaments.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.id}`}
                  className="group bg-white/[0.04] border border-white/[0.08] hover:border-[#00ff88]/40 rounded-2xl p-5 transition-all block"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-extrabold text-[15px] tracking-tight group-hover:text-[#00ff88] transition-colors leading-snug">
                      {t.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 flex-shrink-0 mt-0.5">
                      Aberto
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-400 mb-3">
                    📅 {formatDateRange(t.startDate, t.endDate)}
                  </p>
                  {t.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {t.categories.slice(0, 4).map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 bg-white/5 rounded-full text-[11px] text-gray-400"
                        >
                          {cat}
                        </span>
                      ))}
                      {t.categories.length > 4 && (
                        <span className="px-2 py-0.5 bg-white/5 rounded-full text-[11px] text-gray-400">
                          +{t.categories.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="w-full py-2.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl font-extrabold text-[13px] text-center group-hover:bg-[#00ff99] transition-colors">
                    Inscrever-se →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── SOBRE ────────────────────────────────────────────────────────── */}
        {description && (
          <section className="py-8 border-b border-white/[0.07]">
            <h2 className="text-[16px] font-extrabold tracking-tight mb-4">
              Sobre o Clube
            </h2>
            <p className="text-[14px] text-gray-300 leading-relaxed">
              {description}
            </p>
          </section>
        )}

        {/* ── ESTRUTURA & COMODIDADES ──────────────────────────────────────── */}
        {(courtsCount > 0 || amenities.length > 0) && (
          <section className="py-8 border-b border-white/[0.07]">
            <h2 className="text-[16px] font-extrabold tracking-tight mb-5">
              Estrutura
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {courtsCount > 0 && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                    🏟️ Quadras ({courtsCount})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {club.courts!.map((c, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-[13px] font-semibold text-gray-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {amenities.length > 0 && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                    ✨ Comodidades
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {amenities.map((key) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-[13px] text-gray-300"
                      >
                        <span>{AMENITY_ICONS[key] ?? "✓"}</span>
                        <span>{AMENITY_LABELS[key] ?? key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── PROFESSORES ──────────────────────────────────────────────────── */}
        {instructors.length > 0 && (
          <section className="py-8 border-b border-white/[0.07]">
            <h2 className="text-[16px] font-extrabold tracking-tight mb-5">
              Professores
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.map((inst: any) => (
                <div
                  key={inst.id}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {inst.photoUrl ? (
                      <img
                        src={inst.photoUrl}
                        alt={inst.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-black text-[#00ff88]">
                        {inst.name?.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[14px] tracking-tight">
                      {inst.name}
                    </p>
                    {inst.sports?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 mb-2">
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
                      <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-3">
                        {inst.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CONTATO & HORÁRIOS ───────────────────────────────────────────── */}
        <section className="py-8 border-b border-white/[0.07]">
          <h2 className="text-[16px] font-extrabold tracking-tight mb-5">
            Contato & Localização
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
              {club.phone && (
                <div className="flex items-start gap-3">
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
                    <p className="text-[11px] font-bold text-gray-500 mb-0.5">
                      WhatsApp / Telefone
                    </p>
                    <a
                      href={`https://wa.me/${club.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-semibold text-white hover:text-[#00ff88] transition-colors"
                    >
                      {club.phone}
                    </a>
                  </div>
                </div>
              )}
              {location !== "—" && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
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
                    <p className="text-[11px] font-bold text-gray-500 mb-0.5">
                      Localização
                    </p>
                    <p className="text-[14px] font-semibold text-white">
                      {location}
                    </p>
                  </div>
                </div>
              )}
              {!club.phone && location === "—" && (
                <p className="text-[13px] text-gray-500 italic">
                  Informações de contato não disponíveis.
                </p>
              )}
            </div>

            {hasBusinessHours && (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  🕐 Horário de Funcionamento
                </p>
                <div className="space-y-2">
                  {Object.entries(WEEKDAY_LABELS).map(([key, label]) => {
                    const hours = businessHours[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-gray-400 font-medium">
                          {label}
                        </span>
                        <span
                          className={
                            hours
                              ? "font-semibold text-gray-200"
                              : "text-gray-600"
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
          </div>
        </section>

        {/* ── TODOS OS TORNEIOS ────────────────────────────────────────────── */}
        <section className="py-8 border-b border-white/[0.07]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-[16px] font-extrabold tracking-tight">
              Torneios
            </h2>
            <div className="flex gap-2 flex-wrap">
              {(["all", "open", "ongoing", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
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
                        ? "Em Andamento"
                        : "Concluídos"}
                </button>
              ))}
            </div>
          </div>
          {filteredTournaments.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-500">
              <span className="text-4xl mb-3 opacity-40">🎾</span>
              <p className="font-semibold text-gray-400">
                Nenhum torneio nesta categoria
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                    className="group flex items-center justify-between gap-4 bg-white/[0.03] border border-white/[0.07] hover:border-[#00ff88]/30 hover:bg-white/[0.05] rounded-2xl px-5 py-4 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {normalizeSport(t.sport)}
                        </span>
                      </div>
                      <p className="font-extrabold text-[14px] tracking-tight group-hover:text-[#00ff88] transition-colors truncate">
                        {t.name}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {formatDateRange(t.startDate, t.endDate)} ·{" "}
                        {t._count.teams} duplas
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isOpen && (
                        <span className="px-3 py-1.5 bg-[#00ff88] text-[#0a0e1a] rounded-xl text-[12px] font-extrabold hidden sm:block">
                          Inscrever-se
                        </span>
                      )}
                      <svg
                        className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors"
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

        {/* ── FEED / FOTOS (placeholder Sprint 8) ─────────────────────────── */}
        <section className="py-8">
          <h2 className="text-[16px] font-extrabold tracking-tight mb-5">
            Fotos & Feed
          </h2>
          <div className="bg-white/[0.03] border border-white/[0.07] border-dashed rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-3 opacity-30">📸</span>
            <p className="text-[14px] font-bold text-gray-600 mb-1">Em breve</p>
            <p className="text-[12px] text-gray-700">
              Fotos e resultados dos torneios aparecerão aqui.
            </p>
          </div>
        </section>
      </main>

      {/* ── Mobile WhatsApp CTA fixo ─────────────────────────────────────── */}
      {club.phone && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.07]">
          <a
            href={`https://wa.me/${club.phone.replace(/\D/g, "")}`}
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
      <footer className="border-t border-white/[0.07] py-8 px-6 mt-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-gray-600">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#00ff88] rounded flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-[#0a0e1a]"
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
            <span className="font-extrabold text-white">Bubble</span>
          </Link>
          <p>
            © {new Date().getFullYear()} Bubble. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
