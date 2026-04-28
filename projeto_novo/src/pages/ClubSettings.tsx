import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import { useClub, useTournaments } from "../hooks";
import { useAuth } from "../contexts/AuthContext";

const INPUT_CLS =
  "w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all placeholder:text-gray-400 placeholder:font-normal";
const LABEL_CLS = "block text-[12px] font-semibold text-gray-500 mb-1.5";

const SIDEBAR = [
  {
    key: "perfil",
    label: "Perfil",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    key: "estrutura",
    label: "Estrutura",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zM14 13a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z",
  },
  {
    key: "esportes",
    label: "Esportes & Horários",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "professores",
    label: "Professores",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    key: "contato",
    label: "Contato & Redes",
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  },
  {
    key: "financeiro",
    label: "Financeiro",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H9a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    key: "conta",
    label: "Conta",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    key: "notificacoes",
    label: "Notificações",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    key: "privacidade",
    label: "Privacidade",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
  {
    key: "permissoes",
    label: "Permissões",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
] as const;
type SidebarKey = (typeof SIDEBAR)[number]["key"];

const SPORTS_LIST = [
  { key: "PADEL", label: "Padel", icon: "🎾" },
  { key: "BEACH_TENNIS", label: "Beach Tennis", icon: "🏖️" },
  { key: "TENIS", label: "Tênis", icon: "🎾" },
  { key: "PICKLEBALL", label: "Pickleball", icon: "🏓" },
] as const;

const WEEKDAYS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
] as const;
type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

interface Instructor {
  id: string;
  name: string;
  bio: string;
  sports: string[];
  photoUrl: string;
}

const EXTRAS_LIST = [
  { key: "estacionamento", label: "Estacionamento", icon: "🚗" },
  { key: "bar", label: "Bar", icon: "🍺" },
  { key: "restaurante", label: "Restaurante", icon: "🍽️" },
  { key: "vestiarios", label: "Vestiários", icon: "🚿" },
  { key: "salaoFestas", label: "Salão de Festas", icon: "🎉" },
  { key: "churrasqueira", label: "Churrasqueira", icon: "🔥" },
  { key: "academia", label: "Academia / Fitness", icon: "💪" },
  { key: "loja", label: "Loja / Pro Shop", icon: "🛒" },
  { key: "piscina", label: "Piscina", icon: "🏊" },
  { key: "areaKids", label: "Área Kids", icon: "🧒" },
  { key: "wifi", label: "Wi-Fi", icon: "📶" },
  { key: "arquibancada", label: "Arquibancada", icon: "🏟️" },
  { key: "iluminacao", label: "Iluminação Noturna", icon: "💡" },
  { key: "cameras", label: "Câmeras de Segurança", icon: "📷" },
] as const;
type ExtraKey = (typeof EXTRAS_LIST)[number]["key"];
type ExtrasState = Record<ExtraKey, boolean>;
const INITIAL_EXTRAS: ExtrasState = EXTRAS_LIST.reduce(
  (acc, e) => ({ ...acc, [e.key]: false }),
  {} as ExtrasState,
);

const PAYMENT_METHODS = [
  { key: "pix", label: "PIX", desc: "Transferência instantânea" },
  {
    key: "boleto",
    label: "Boleto Bancário",
    desc: "Compensação em até 3 dias úteis",
  },
  {
    key: "creditCard",
    label: "Cartão de Crédito",
    desc: "Visa, Mastercard, Elo",
  },
  {
    key: "debitCard",
    label: "Cartão de Débito",
    desc: "Débito imediato na conta",
  },
] as const;

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ── Mask formatters ──────────────────────────────────────────────────────────
function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d
      .replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
      .replace(/-$/, "");
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-blue-600" : "bg-gray-300"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`}
    />
  </button>
);

const ClubSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";

  const { user } = useAuth();
  const { club, loading, saving, updateClub } = useClub();
  const { tournaments } = useTournaments();

  const [activeTab, setActiveTab] = useState<SidebarKey>(
    isWelcome ? "estrutura" : "perfil",
  );
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(isWelcome);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [perfil, setPerfil] = useState({
    name: "",
    cnpj: "",
    phone: "",
    slogan: "",
    description: "",
  });
  const [courts, setCourts] = useState<string[]>([]);
  const [extras, setExtras] = useState<ExtrasState>(INITIAL_EXTRAS);
  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [mapQuery, setMapQuery] = useState("");
  const [pixKeys, setPixKeys] = useState<
    Array<{ id: string; tipo: string; chave: string }>
  >([]);
  const [paymentMethods, setPaymentMethods] = useState({
    pix: false,
    boleto: false,
    creditCard: false,
    debitCard: false,
  });
  // Sprint 7B — novos campos
  const [clubSports, setClubSports] = useState<string[]>([]);
  const [businessHours, setBusinessHours] = useState<
    Record<WeekdayKey, string>
  >({
    seg: "",
    ter: "",
    qua: "",
    qui: "",
    sex: "",
    sab: "",
    dom: "",
  });
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [socialLinks, setSocialLinks] = useState({
    whatsappNumber: "",
    instagramUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
    threadsUrl: "",
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [deletedInstructorIds, setDeletedInstructorIds] = useState<string[]>(
    [],
  );

  const [contaForm, setContaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [showPassword, setShowPassword] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });

  useEffect(() => {
    setPerfil((prev) => ({
      ...prev,
      name: club?.name || user?.name || prev.name,
      cnpj: club?.cnpj || prev.cnpj,
      phone: club?.phone ?? prev.phone,
      slogan: (club as any)?.slogan ?? prev.slogan,
      description: (club as any)?.description ?? prev.description,
    }));
    if (club?.courts) setCourts(club.courts);
    if ((club as any)?.sports) setClubSports((club as any).sports);
    if ((club as any)?.businessHours)
      setBusinessHours((club as any).businessHours);
    if ((club as any)?.instructors)
      setInstructors(
        (club as any).instructors.map((i: any) => ({
          ...i,
          photoUrl: i.photoUrl ?? "",
        })),
      );
    if ((club as any)?.logoUrl) setLogoUrl((club as any).logoUrl ?? "");
    if ((club as any)?.coverUrl) setCoverUrl((club as any).coverUrl ?? "");
    setSocialLinks({
      whatsappNumber: (club as any)?.whatsappNumber ?? "",
      instagramUrl: (club as any)?.instagramUrl ?? "",
      youtubeUrl: (club as any)?.youtubeUrl ?? "",
      twitterUrl: (club as any)?.twitterUrl ?? "",
      threadsUrl: (club as any)?.threadsUrl ?? "",
    });
    setEndereco((p) => ({
      cep: (club as any)?.cep ?? p.cep,
      rua: (club as any)?.street ?? p.rua,
      numero: (club as any)?.addressNumber ?? p.numero,
      bairro: (club as any)?.neighborhood ?? p.bairro,
      cidade: club?.city ?? p.cidade,
      estado: club?.state ?? p.estado,
    }));
    if ((club as any)?.amenities?.length) {
      const am = (club as any).amenities as string[];
      setExtras(
        EXTRAS_LIST.reduce(
          (acc, e) => ({ ...acc, [e.key]: am.includes(e.key) }),
          {} as ExtrasState,
        ),
      );
    }
    if ((club as any)?.paymentMethods) {
      setPaymentMethods((club as any).paymentMethods);
    }
    if ((club as any)?.pixKeys) {
      setPixKeys((club as any).pixKeys);
    }
  }, [club, user]);

  useEffect(() => {
    const { rua, numero, bairro, cidade, estado } = endereco;
    if (cidade && estado) {
      setMapQuery(
        [rua, numero, bairro, cidade, estado].filter(Boolean).join(", "),
      );
    }
  }, [endereco]);

  const markDirty = () => {
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const dismissWelcome = () => {
    setShowWelcomeBanner(false);
    searchParams.delete("welcome");
    setSearchParams(searchParams);
  };

  const handleSaveAll = async () => {
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
    const token = localStorage.getItem("auth_token") ?? "";
    const h = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Save club profile (all flat fields)
    await updateClub({
      name: perfil.name,
      cnpj: perfil.cnpj,
      phone: perfil.phone,
      city: endereco.cidade,
      state: endereco.estado,
      cep: endereco.cep,
      street: endereco.rua,
      addressNumber: endereco.numero,
      neighborhood: endereco.bairro,
      courts,
      slogan: perfil.slogan,
      description: perfil.description,
      logoUrl: logoUrl || undefined,
      coverUrl: coverUrl || undefined,
      sports: clubSports,
      amenities: EXTRAS_LIST.filter((e) => extras[e.key]).map((e) => e.key),
      businessHours,
      paymentMethods,
      pixKeys,
      ...socialLinks,
    } as any);

    // Sync instructors separately
    for (const id of deletedInstructorIds) {
      await fetch(`${API_URL}/club/instructors/${id}`, {
        method: "DELETE",
        headers: h,
      }).catch(() => {});
    }
    setDeletedInstructorIds([]);

    const newInstructors: Instructor[] = [];
    for (const inst of instructors) {
      if (/^\d{10,}$/.test(inst.id)) {
        // new (temp id from Date.now())
        const r = await fetch(`${API_URL}/club/instructors`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            name: inst.name,
            bio: inst.bio,
            sports: inst.sports,
            photoUrl: inst.photoUrl || null,
            order: 0,
          }),
        });
        const j = await r.json();
        newInstructors.push({ ...inst, id: j.data?.id ?? inst.id });
      } else {
        await fetch(`${API_URL}/club/instructors/${inst.id}`, {
          method: "PATCH",
          headers: h,
          body: JSON.stringify({
            name: inst.name,
            bio: inst.bio,
            sports: inst.sports,
            photoUrl: inst.photoUrl || null,
          }),
        }).catch(() => {});
        newInstructors.push(inst);
      }
    }
    setInstructors(newInstructors);

    setIsDirty(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="text-gray-500 text-sm font-medium">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-gray-900">
      <DashboardHeader activePage="dashboard" />
      <main className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:py-8">
          {/* Page header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">
                Configurações
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gerencie o perfil e as informações do seu clube
              </p>
            </div>
            {club?.id && (
              <a
                href={`/clubs/${club.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-bold text-sm transition-colors shadow-sm"
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Ver perfil público
              </a>
            )}
          </div>
          {showWelcomeBanner && (
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xl">👋</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">
                    Bem-vindo ao BubblePadel!
                  </h3>
                  <p className="text-blue-100 text-sm mt-0.5">
                    Para criar seu primeiro torneio,{" "}
                    <strong>cadastre suas quadras</strong> na aba Estrutura.
                  </p>
                </div>
              </div>
              <button
                onClick={dismissWelcome}
                className="text-white/70 hover:text-white flex-shrink-0"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Mobile nav */}
          <div className="lg:hidden mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {SIDEBAR.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${activeTab === item.key ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-white text-gray-600 border border-gray-200"}`}
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
                      d={item.icon}
                    />
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden sticky top-24">
                <nav className="py-2">
                  {SIDEBAR.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-[13px] font-semibold transition-colors ${activeTab === item.key ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-l-2 border-transparent"}`}
                    >
                      <svg
                        style={{ width: "1.125rem", height: "1.125rem" }}
                        className="flex-shrink-0"
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
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* PERFIL */}
              {activeTab === "perfil" && (
                <div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-5">
                    Perfil do Clube
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
                    <div>
                      <label className={LABEL_CLS}>Logo do Clube</label>
                      <div className="flex items-center gap-5">
                        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <button className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                            Carregar Logo
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG ou JPG, máx 2MB. Recomendado 200×200px
                          </p>
                        </div>
                      </div>
                    </div>
                    {[
                      {
                        field: "name",
                        label: "Nome do Clube",
                        placeholder: "Nome do seu clube",
                      },
                      {
                        field: "cnpj",
                        label: "CNPJ",
                        placeholder: "00.000.000/0000-00",
                      },
                      {
                        field: "phone",
                        label: "Contato",
                        placeholder: "(00) 0 0000-0000",
                      },
                      {
                        field: "slogan",
                        label: "Slogan",
                        placeholder: "Slogan do seu clube",
                      },
                    ].map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className={LABEL_CLS}>{label}</label>
                        <input
                          value={perfil[field as keyof typeof perfil]}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (field === "cnpj") val = maskCNPJ(val);
                            else if (field === "phone") val = maskPhone(val);
                            setPerfil((p) => ({ ...p, [field]: val }));
                            markDirty();
                          }}
                          placeholder={placeholder}
                          className={INPUT_CLS}
                        />
                      </div>
                    ))}
                    <div>
                      <label className={LABEL_CLS}>Descrição</label>
                      <textarea
                        value={perfil.description}
                        onChange={(e) => {
                          setPerfil((p) => ({
                            ...p,
                            description: e.target.value,
                          }));
                          markDirty();
                        }}
                        rows={4}
                        placeholder="Descrição do clube"
                        className={`${INPUT_CLS} resize-none`}
                      />
                    </div>

                    {/* Tab action buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saveSuccess ? "bg-emerald-50 border border-emerald-300 text-emerald-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"} disabled:opacity-50`}
                      >
                        {saving
                          ? "Salvando..."
                          : saveSuccess
                            ? "✓ Salvo!"
                            : "Salvar"}
                      </button>
                      <div>
                        <button
                          onClick={() => setActiveTab("estrutura")}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                        >
                          Próximo: Estrutura
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ESTRUTURA */}
              {activeTab === "estrutura" && (
                <div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-5">
                    Estrutura
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-6">
                    {/* Quadras */}
                    <div>
                      <label className={LABEL_CLS}>Quadras</label>
                      <p className="text-xs text-gray-500 mb-3">
                        Pré-preenchidas automaticamente ao criar torneios.
                      </p>
                      <button
                        onClick={() => {
                          setCourts((p) => [...p, `Quadra ${p.length + 1}`]);
                          markDirty();
                        }}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold mb-3"
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
                      {courts.length === 0 ? (
                        <div className="text-gray-500 text-sm italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          Nenhuma quadra adicionada. Adicione pelo menos uma
                          para criar torneios.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {courts.map((q, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3"
                            >
                              <span className="text-xs text-gray-400 w-5">
                                {idx + 1}
                              </span>
                              <input
                                value={q}
                                onChange={(e) => {
                                  setCourts((p) =>
                                    p.map((c, i) =>
                                      i === idx ? e.target.value : c,
                                    ),
                                  );
                                  markDirty();
                                }}
                                className="text-sm text-gray-900 flex-1 bg-transparent outline-none focus:text-blue-600"
                              />
                              <button
                                onClick={() => {
                                  setCourts((p) =>
                                    p.filter((_, i) => i !== idx),
                                  );
                                  markDirty();
                                }}
                                className="text-red-400 hover:text-red-500"
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

                    {/* Extras */}
                    <div>
                      <label className={LABEL_CLS}>Comodidades e Extras</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {EXTRAS_LIST.map(({ key, label, icon }) => (
                          <label
                            key={key}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${extras[key] ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:border-gray-300"}`}
                          >
                            <input
                              type="checkbox"
                              checked={extras[key]}
                              onChange={() => {
                                setExtras((p) => ({ ...p, [key]: !p[key] }));
                                markDirty();
                              }}
                              className="hidden"
                            />
                            <span className="text-lg leading-none">{icon}</span>
                            <span className="text-sm text-gray-700 flex-1">
                              {label}
                            </span>
                            {extras[key] && (
                              <svg
                                className="w-4 h-4 text-blue-600 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Endereço */}
                    <div>
                      <label className={LABEL_CLS}>Endereço</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { name: "cep", placeholder: "CEP" },
                          { name: "rua", placeholder: "Rua / Avenida" },
                          { name: "numero", placeholder: "Número" },
                          { name: "bairro", placeholder: "Bairro" },
                          { name: "cidade", placeholder: "Cidade" },
                          { name: "estado", placeholder: "Estado" },
                        ].map(({ name, placeholder }) => (
                          <input
                            key={name}
                            value={endereco[name as keyof typeof endereco]}
                            onChange={(e) => {
                              setEndereco((p) => ({
                                ...p,
                                [name]: e.target.value,
                              }));
                              markDirty();
                            }}
                            placeholder={placeholder}
                            className={INPUT_CLS}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Mapa */}
                    {mapQuery && (
                      <div>
                        <label className={LABEL_CLS}>Localização no Mapa</label>
                        <div className="rounded-xl overflow-hidden border border-gray-200 h-64 bg-gray-100">
                          <iframe
                            title="Localização do clube"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Atualizado automaticamente com o endereço acima.
                        </p>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saveSuccess ? "bg-emerald-50 border border-emerald-300 text-emerald-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"} disabled:opacity-50`}
                      >
                        {saving
                          ? "Salvando..."
                          : saveSuccess
                            ? "✓ Salvo!"
                            : "Salvar"}
                      </button>
                      <div>
                        <button
                          onClick={() => setActiveTab("esportes")}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                        >
                          Próximo: Esportes & Horários
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ESPORTES & HORÁRIOS */}
              {activeTab === "esportes" && (
                <div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-5">
                    Esportes & Horários de Funcionamento
                  </h2>

                  {/* Esportes */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-1">
                      Esportes Disponíveis
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Aparecem no perfil público do clube.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {SPORTS_LIST.map(({ key, label, icon }) => {
                        const selected = clubSports.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setClubSports((prev) =>
                                prev.includes(key)
                                  ? prev.filter((s) => s !== key)
                                  : [...prev, key],
                              );
                              markDirty();
                            }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] transition-all ${selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                          >
                            <span className="text-2xl">{icon}</span>
                            <span className="text-[12px] font-bold">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horários */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-1">
                      Horário de Funcionamento
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Formato: "08:00-22:00". Deixe em branco para dias
                      fechados.
                    </p>
                    <div className="space-y-3">
                      {WEEKDAYS.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-[13px] font-semibold text-gray-600 w-20 flex-shrink-0">
                            {label}
                          </span>
                          <input
                            type="text"
                            placeholder="Fechado"
                            value={businessHours[key]}
                            onChange={(e) => {
                              setBusinessHours((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }));
                              markDirty();
                            }}
                            className="flex-1 px-3.5 py-2 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all placeholder:text-gray-300 placeholder:font-normal"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSaveAll}
                      disabled={saving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saveSuccess ? "bg-emerald-50 border border-emerald-300 text-emerald-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"} disabled:opacity-50`}
                    >
                      {saving
                        ? "Salvando..."
                        : saveSuccess
                          ? "✓ Salvo!"
                          : "Salvar"}
                    </button>
                    <button
                      onClick={() => setActiveTab("professores")}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                    >
                      Próximo: Professores
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* PROFESSORES */}
              {activeTab === "professores" && (
                <div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-5">
                    Professores
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">
                          Equipe de Professores
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Aparecem no perfil público do clube.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInstructors((prev) => [
                            ...prev,
                            {
                              id: Date.now().toString(),
                              name: "",
                              bio: "",
                              sports: [],
                              photoUrl: "",
                            },
                          ]);
                          markDirty();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        + Adicionar
                      </button>
                    </div>

                    {instructors.length === 0 ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <span className="text-4xl mb-3 opacity-40">👨‍🏫</span>
                        <p className="text-[14px] font-bold text-gray-700 mb-1">
                          Nenhum professor cadastrado
                        </p>
                        <p className="text-[12px] text-gray-400">
                          Adicione os professores disponíveis no clube
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {instructors.map((inst, idx) => (
                          <div
                            key={inst.id}
                            className="border border-gray-200 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">
                                Professor {idx + 1}
                              </span>
                              <button
                                onClick={() => {
                                  if (!/^\d{10,}$/.test(inst.id))
                                    setDeletedInstructorIds((prev) => [
                                      ...prev,
                                      inst.id,
                                    ]);
                                  setInstructors((prev) =>
                                    prev.filter((i) => i.id !== inst.id),
                                  );
                                  markDirty();
                                }}
                                className="text-red-400 hover:text-red-600 text-xs font-bold transition-colors"
                              >
                                Remover
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={LABEL_CLS}>Nome</label>
                                <input
                                  value={inst.name}
                                  placeholder="Nome do professor"
                                  onChange={(e) => {
                                    setInstructors((prev) =>
                                      prev.map((i) =>
                                        i.id === inst.id
                                          ? { ...i, name: e.target.value }
                                          : i,
                                      ),
                                    );
                                    markDirty();
                                  }}
                                  className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all placeholder:text-gray-400 placeholder:font-normal"
                                />
                              </div>
                              <div>
                                <label className={LABEL_CLS}>Foto (URL)</label>
                                <input
                                  value={inst.photoUrl}
                                  placeholder="https://..."
                                  onChange={(e) => {
                                    setInstructors((prev) =>
                                      prev.map((i) =>
                                        i.id === inst.id
                                          ? { ...i, photoUrl: e.target.value }
                                          : i,
                                      ),
                                    );
                                    markDirty();
                                  }}
                                  className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all placeholder:text-gray-400 placeholder:font-normal"
                                />
                              </div>
                            </div>
                            <div>
                              <label className={LABEL_CLS}>Esportes</label>
                              <div className="flex gap-2 flex-wrap mt-1">
                                {SPORTS_LIST.filter(({ key }) => clubSports.length === 0 || clubSports.includes(key)).map(({ key, label }) => (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      setInstructors((prev) =>
                                        prev.map((i) =>
                                          i.id === inst.id
                                            ? {
                                                ...i,
                                                sports: i.sports.includes(key)
                                                  ? i.sports.filter(
                                                      (s) => s !== key,
                                                    )
                                                  : [...i.sports, key],
                                              }
                                            : i,
                                        ),
                                      );
                                      markDirty();
                                    }}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${inst.sports.includes(key) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className={LABEL_CLS}>
                                Bio / Especialidade
                              </label>
                              <textarea
                                value={inst.bio}
                                rows={2}
                                placeholder="Ex: Especialista em Beach Tennis, 10 anos de experiência..."
                                onChange={(e) => {
                                  setInstructors((prev) =>
                                    prev.map((i) =>
                                      i.id === inst.id
                                        ? { ...i, bio: e.target.value }
                                        : i,
                                    ),
                                  );
                                  markDirty();
                                }}
                                className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all placeholder:text-gray-400 placeholder:font-normal resize-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSaveAll}
                      disabled={saving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saveSuccess ? "bg-emerald-50 border border-emerald-300 text-emerald-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"} disabled:opacity-50`}
                    >
                      {saving
                        ? "Salvando..."
                        : saveSuccess
                          ? "✓ Salvo!"
                          : "Salvar"}
                    </button>
                    <button
                      onClick={() => setActiveTab("contato")}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                    >
                      Próximo: Contato & Redes
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* CONTATO & REDES SOCIAIS */}
              {activeTab === "contato" && (
                <div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-5">
                    Contato & Redes Sociais
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4 mb-5">
                    <p className="text-[12px] text-gray-500">
                      Essas informações aparecem no perfil público do clube.
                    </p>

                    <div>
                      <label className={LABEL_CLS}>
                        WhatsApp (número público)
                      </label>
                      <input
                        value={socialLinks.whatsappNumber}
                        onChange={(e) => {
                          setSocialLinks((p) => ({
                            ...p,
                            whatsappNumber: e.target.value,
                          }));
                          markDirty();
                        }}
                        placeholder="5511999999999 (com código do país, sem + ou espaços)"
                        className={INPUT_CLS}
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[12px] font-bold text-gray-500 mb-3">
                        Redes Sociais
                      </p>
                      {[
                        {
                          key: "instagramUrl",
                          label: "Instagram",
                          icon: "📸",
                          placeholder: "https://instagram.com/seuperfil",
                        },
                        {
                          key: "youtubeUrl",
                          label: "YouTube",
                          icon: "▶️",
                          placeholder: "https://youtube.com/@seuperfil",
                        },
                        {
                          key: "twitterUrl",
                          label: "Twitter / X",
                          icon: "𝕏",
                          placeholder: "https://x.com/seuperfil",
                        },
                        {
                          key: "threadsUrl",
                          label: "Threads",
                          icon: "🧵",
                          placeholder: "https://threads.net/@seuperfil",
                        },
                      ].map(({ key, label, icon, placeholder }) => (
                        <div key={key} className="mb-3">
                          <label className={LABEL_CLS}>
                            {icon} {label}
                          </label>
                          <input
                            value={socialLinks[key as keyof typeof socialLinks]}
                            onChange={(e) => {
                              setSocialLinks((p) => ({
                                ...p,
                                [key]: e.target.value,
                              }));
                              markDirty();
                            }}
                            placeholder={placeholder}
                            className={INPUT_CLS}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSaveAll}
                      disabled={saving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saveSuccess ? "bg-emerald-50 border border-emerald-300 text-emerald-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"} disabled:opacity-50`}
                    >
                      {saving
                        ? "Salvando..."
                        : saveSuccess
                          ? "✓ Salvo!"
                          : "Salvar"}
                    </button>
                    <button
                      onClick={() => setActiveTab("financeiro")}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                    >
                      Próximo: Financeiro
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* FINANCEIRO */}
              {activeTab === "financeiro" && (
                <div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-5">
                    Financeiro
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-6">
                    <div>
                      <label className={LABEL_CLS}>
                        Métodos de Pagamento Aceitos
                      </label>
                      <p className="text-xs text-gray-500 mb-4">
                        Defina os métodos padrão do seu clube. Podem ser
                        ajustados em cada torneio.
                      </p>
                      <div className="space-y-3">
                        {PAYMENT_METHODS.map(({ key, label, desc }) => (
                          <div
                            key={key}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${paymentMethods[key as keyof typeof paymentMethods] ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {label}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {desc}
                              </p>
                            </div>
                            <Toggle
                              checked={
                                paymentMethods[
                                  key as keyof typeof paymentMethods
                                ]
                              }
                              onChange={() => {
                                setPaymentMethods((p) => ({
                                  ...p,
                                  [key]: !p[key as keyof typeof paymentMethods],
                                }));
                                markDirty();
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLS}>Chaves PIX</label>
                      <button
                        onClick={() => {
                          setPixKeys((p) => [
                            ...p,
                            {
                              id: Date.now().toString(),
                              tipo: "E-mail",
                              chave: "",
                            },
                          ]);
                          markDirty();
                        }}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold mb-3"
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
                        Adicionar Chave PIX
                      </button>
                      {pixKeys.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">
                          Nenhuma chave PIX adicionada
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {pixKeys.map((pix, idx) => (
                            <div
                              key={pix.id}
                              className="flex items-center gap-3"
                            >
                              <span className="text-gray-400 text-sm w-5">
                                {idx + 1}º
                              </span>
                              <select
                                value={pix.tipo}
                                onChange={(e) => {
                                  setPixKeys((p) =>
                                    p.map((k) =>
                                      k.id === pix.id
                                        ? { ...k, tipo: e.target.value }
                                        : k,
                                    ),
                                  );
                                  markDirty();
                                }}
                                className="px-3 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                              >
                                <option>E-mail</option>
                                <option>Celular</option>
                                <option>CNPJ</option>
                                <option>Chave Aleatória</option>
                              </select>
                              <input
                                value={pix.chave}
                                onChange={(e) => {
                                  setPixKeys((p) =>
                                    p.map((k) =>
                                      k.id === pix.id
                                        ? { ...k, chave: e.target.value }
                                        : k,
                                    ),
                                  );
                                  markDirty();
                                }}
                                placeholder="Digite a chave PIX"
                                className={`${INPUT_CLS} flex-1`}
                              />
                              <button
                                onClick={() => {
                                  setPixKeys((p) =>
                                    p.filter((k) => k.id !== pix.id),
                                  );
                                  markDirty();
                                }}
                                className="text-red-400 hover:text-red-500 p-2"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saveSuccess ? "bg-emerald-50 border border-emerald-300 text-emerald-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"} disabled:opacity-50`}
                      >
                        {saving
                          ? "Salvando..."
                          : saveSuccess
                            ? "✓ Salvo!"
                            : "Salvar"}
                      </button>
                      <div>
                        <button
                          onClick={() => setActiveTab("conta")}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                        >
                          Próximo: Conta
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTA */}
              {activeTab === "conta" && (
                <div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-5">
                    Conta
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-5">
                    <div>
                      <label className={LABEL_CLS}>Email Atual</label>
                      <div className="flex items-center gap-3">
                        <input
                          value={user?.email ?? ""}
                          disabled
                          className={`${INPUT_CLS} flex-1 opacity-60 cursor-not-allowed`}
                        />
                        <button className="px-4 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-semibold whitespace-nowrap">
                          Alterar Email
                        </button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-base font-bold mb-4">
                        Alterar Senha
                      </h3>
                      <div className="space-y-4">
                        {[
                          {
                            key: "atual" as const,
                            label: "Senha Atual",
                            field: "senhaAtual",
                          },
                          {
                            key: "nova" as const,
                            label: "Nova Senha",
                            field: "novaSenha",
                          },
                          {
                            key: "confirmar" as const,
                            label: "Confirmar Nova Senha",
                            field: "confirmarSenha",
                          },
                        ].map(({ key, label, field }) => (
                          <div key={key}>
                            <label className={LABEL_CLS}>{label}</label>
                            <div className="relative">
                              <input
                                type={showPassword[key] ? "text" : "password"}
                                value={
                                  contaForm[field as keyof typeof contaForm]
                                }
                                onChange={(e) =>
                                  setContaForm((p) => ({
                                    ...p,
                                    [field]: e.target.value,
                                  }))
                                }
                                className={INPUT_CLS}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword((p) => ({
                                    ...p,
                                    [key]: !p[key],
                                  }))
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                    d={
                                      showPassword[key]
                                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    }
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="mt-4 w-full py-3 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all">
                        Alterar Senha
                      </button>
                    </div>

                    {/* Tab action buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saveSuccess ? "bg-emerald-50 border border-emerald-300 text-emerald-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"} disabled:opacity-50`}
                      >
                        {saving
                          ? "Salvando..."
                          : saveSuccess
                            ? "✓ Salvo!"
                            : "Salvar"}
                      </button>
                      <button
                        onClick={() => setActiveTab("notificacoes")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                      >
                        Próximo: Notificações
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* OUTRAS ABAS */}
              {(activeTab === "notificacoes" ||
                activeTab === "privacidade" ||
                activeTab === "permissoes") && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-7 h-7 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg capitalize">
                      {activeTab}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Esta seção ainda está em desenvolvimento
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ASIDE DIREITO */}
            <aside className="hidden xl:block w-64 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 sticky top-24">
                <h3 className="font-bold text-base">Conta</h3>

                {/* Avatar + nome */}
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">
                      {(club?.name || user?.name || "C")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {club?.name || user?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {user?.email ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                      Membro desde
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {formatDate(club?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                      Torneios criados
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {tournaments.length} torneio
                      {tournaments.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Botão Salvar */}
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={handleSaveAll}
                    disabled={!isDirty || saving}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                      saveSuccess
                        ? "bg-emerald-50 border border-emerald-300 text-emerald-600"
                        : isDirty
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {saving
                      ? "Salvando..."
                      : saveSuccess
                        ? "✓ Salvo!"
                        : "Salvar Alterações"}
                  </button>
                  {isDirty && !saving && (
                    <p className="text-xs text-orange-500 text-center mt-2">
                      Alterações não salvas
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClubSettings;
