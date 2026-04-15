import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";
import { uploadImage } from "../lib/supabaseClient";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Sport = "PADEL" | "BEACH_TENNIS" | "TENIS" | "PICKLEBALL";
type Gender = "MASCULINO" | "FEMININO" | "NAO_INFORMAR";

interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
}

interface IbgeCity {
  id: number;
  nome: string;
  uf: string;
}

interface AthleteForm {
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  birthDate: string; // DD/MM/AAAA
  city: string;
  state: string;
  bio: string;
  gender: Gender | "";
  sports: Sport[];
  rackets: string[];
  instagramUrl: string;
  twitterUrl: string;
  avatarUrl: string;
  bannerUrl: string;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
});

const SPORTS_OPTIONS: { value: Sport; label: string; icon: string }[] = [
  { value: "PADEL", label: "Padel", icon: "🎾" },
  { value: "BEACH_TENNIS", label: "Beach Tennis", icon: "🏖️" },
  { value: "TENIS", label: "Tênis", icon: "🎾" },
  { value: "PICKLEBALL", label: "Pickleball", icon: "🏓" },
];

const RACKET_BRANDS = [
  "Babolat", "Nox", "Adidas", "Head", "Wilson",
  "Bullpadel", "StarVie", "Siux", "Varlion", "Dunlop",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Converte ISO → DD/MM/AAAA */
function isoToBR(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Converte DD/MM/AAAA → ISO YYYY-MM-DD */
function brToISO(br: string): string {
  const [dd, mm, yyyy] = br.split("/");
  if (!dd || !mm || !yyyy || yyyy.length < 4) return "";
  return `${yyyy}-${mm}-${dd}`;
}

/** Máscara de data BR: aceita só dígitos, formata DD/MM/AAAA */
function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Máscara celular BR: (XX) X XXXX-XXXX */
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** Extrai só dígitos do celular para enviar ao backend */
function phoneDigits(masked: string): string {
  return masked.replace(/\D/g, "");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const AthleteEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<AthleteForm>({
    firstName: "",
    lastName: "",
    nickname: "",
    phone: "",
    birthDate: "",
    city: "",
    state: "",
    bio: "",
    gender: "",
    sports: [],
    rackets: [],
    instagramUrl: "",
    twitterUrl: "",
    avatarUrl: "",
    bannerUrl: "",
  });
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorForm, setSponsorForm] = useState({ name: "", logoUrl: "", websiteUrl: "" });
  const [sponsorAdding, setSponsorAdding] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<IbgeCity[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityTimer, setCityTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string>("");

  // ── Carregar dados ────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/athlete/profile`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API_URL}/athlete/sponsors`, { headers: authHeaders() })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([profileJson, sponsorsJson]) => {
        const d = profileJson.data;
        setUserId(d.id ?? d.userId ?? "");
        setSponsors(sponsorsJson.data ?? []);
        setCityQuery(d.city && d.state ? `${d.city} — ${d.state}` : (d.city ?? ""));

        // Deriva firstName/lastName de fullName se ainda não separados
        let firstName = d.firstName ?? "";
        let lastName = d.lastName ?? "";
        if (!firstName && !lastName && d.fullName) {
          const parts = d.fullName.trim().split(" ");
          firstName = parts[0] ?? "";
          lastName = parts.slice(1).join(" ");
        }

        setForm({
          firstName,
          lastName,
          nickname: d.nickname ?? "",
          phone: d.phone ? maskPhone(d.phone) : "",
          birthDate: d.birthDate ? isoToBR(d.birthDate.split("T")[0]) : "",
          city: d.city ?? "",
          state: d.state ?? "",
          bio: d.bio ?? "",
          gender: (d.gender as Gender) ?? "",
          sports: d.sports ?? [],
          rackets: Array.isArray(d.rackets) ? d.rackets : d.racket ? [d.racket] : [],
          instagramUrl: d.instagramUrl ?? "",
          twitterUrl: d.twitterUrl ?? "",
          avatarUrl: d.avatarUrl ?? "",
          bannerUrl: d.bannerUrl ?? "",
        });
      })
      .catch(() => setError("Erro ao carregar perfil."))
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const set = <K extends keyof AthleteForm>(field: K, value: AthleteForm[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const addSponsor = async () => {
    if (!sponsorForm.name.trim()) return;
    setSponsorAdding(true);
    try {
      const res = await fetch(`${API_URL}/athlete/sponsors`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: sponsorForm.name.trim(),
          logoUrl: sponsorForm.logoUrl.trim() || null,
          websiteUrl: sponsorForm.websiteUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSponsors((s) => [...s, json.data]);
      setSponsorForm({ name: "", logoUrl: "", websiteUrl: "" });
      setSponsorOpen(false);
    } catch {
      setError("Erro ao adicionar patrocinador.");
    } finally {
      setSponsorAdding(false);
    }
  };

  const removeSponsor = async (id: string) => {
    try {
      await fetch(`${API_URL}/athlete/sponsors/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setSponsors((s) => s.filter((sp) => sp.id !== id));
    } catch {
      setError("Erro ao remover patrocinador.");
    }
  };

  const toggleSport = (sport: Sport) =>
    setForm((f) => ({
      ...f,
      sports: f.sports.includes(sport)
        ? f.sports.filter((s) => s !== sport)
        : [...f.sports, sport],
    }));

  const handleCityInput = (value: string) => {
    setCityQuery(value);
    setCitySuggestions([]);
    if (cityTimer) clearTimeout(cityTimer);
    if (value.length < 2) return;
    const t = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`);
        const all: Array<{ id: number; nome: string; microrregiao: { mesorregiao: { UF: { sigla: string } } } }> = await res.json();
        const q = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const filtered = all
          .filter((m) => m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q))
          .slice(0, 8)
          .map((m) => ({ id: m.id, nome: m.nome, uf: m.microrregiao.mesorregiao.UF.sigla }));
        setCitySuggestions(filtered);
      } catch { /* ignora */ } finally {
        setCityLoading(false);
      }
    }, 300);
    setCityTimer(t);
  };

  const selectCity = (city: IbgeCity) => {
    setCityQuery(`${city.nome} — ${city.uf}`);
    setCitySuggestions([]);
    setForm((f) => ({ ...f, city: city.nome, state: city.uf }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      const url = await uploadImage("avatars", file, userId || "anonymous");
      set("avatarUrl", url);
    } catch (err: any) {
      setError("Erro ao fazer upload da foto. Verifique o arquivo e tente novamente.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError("");
    try {
      const url = await uploadImage("banners", file, userId || "anonymous");
      set("bannerUrl", url);
    } catch (err: any) {
      setError("Erro ao fazer upload do banner. Verifique o arquivo e tente novamente.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const isoDate = brToISO(form.birthDate);
      const res = await fetch(`${API_URL}/athlete/profile`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          nickname: form.nickname || null,
          phone: phoneDigits(form.phone) || null,
          birthDate: isoDate || null,
          city: form.city || undefined,
          state: form.state || undefined,
          bio: form.bio || null,
          gender: form.gender || null,
          sports: form.sports,
          rackets: form.rackets.filter(Boolean),
          instagramUrl: form.instagramUrl || null,
          twitterUrl: form.twitterUrl || null,
          avatarUrl: form.avatarUrl || undefined,
          bannerUrl: form.bannerUrl || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <AthleteHeader />
        <div className="flex items-center justify-center pt-32">
          <span className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin inline-block" />
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all";
  const labelCls = "block text-[12px] font-semibold text-gray-500 mb-1.5";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/athlete/profile"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            ←
          </Link>
          <div>
            <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
              Editar Perfil
            </h1>
            <p className="text-[13px] text-gray-500 font-normal">
              Personalize seu perfil de atleta
            </p>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
            <span>✓</span> Perfil salvo com sucesso!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">

          {/* ── Foto + Banner ──────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Inputs ocultos */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />

            {/* Banner clicável */}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="relative h-32 w-full bg-gradient-to-r from-[#0a0e27] to-[#1a2040] group block"
            >
              {form.bannerUrl && (
                <img
                  src={form.bannerUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingBanner ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg">
                    {form.bannerUrl ? "Alterar banner" : "Adicionar banner"} · clique para upload
                  </span>
                )}
              </div>
            </button>

            {/* Avatar sobre o banner */}
            <div className="px-5 pb-5">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="relative group flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-gradient-to-br from-[#00e87a] to-[#00ccff] flex items-center justify-center overflow-hidden"
                  >
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-extrabold text-white">
                        {getInitials(`${form.firstName} ${form.lastName}`) || "?"}
                      </span>
                    )}
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl pointer-events-none">
                    {uploadingAvatar ? (
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="text-white text-lg">✏️</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-[15px] font-extrabold text-gray-900 truncate">
                    {[form.firstName, form.lastName].filter(Boolean).join(" ") || "Seu nome"}
                  </p>
                  {form.nickname && (
                    <p className="text-[12px] text-[#00e87a] font-semibold">{form.nickname}</p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Clique na foto ou no banner para fazer upload · JPG, PNG ou WebP · máx. 5 MB
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {/* ── Coluna esquerda ───────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* ── Informações pessoais ──────────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    Informações Pessoais
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nome *</label>
                      <input
                        required
                        value={form.firstName}
                        onChange={(e) => set("firstName", e.target.value)}
                        placeholder="Rafael"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Sobrenome *</label>
                      <input
                        required
                        value={form.lastName}
                        onChange={(e) => set("lastName", e.target.value)}
                        placeholder="Couto"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Apelido</label>
                      <input
                        value={form.nickname}
                        maxLength={30}
                        onChange={(e) => set("nickname", e.target.value)}
                        placeholder="Ex: Rafa, King"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Gênero</label>
                      <select
                        value={form.gender}
                        onChange={(e) => set("gender", e.target.value as Gender | "")}
                        className={inputCls}
                      >
                        <option value="">Selecionar</option>
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMININO">Feminino</option>
                        <option value="NAO_INFORMAR">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Celular</label>
                      <input
                        value={form.phone}
                        type="tel"
                        inputMode="numeric"
                        onChange={(e) => set("phone", maskPhone(e.target.value))}
                        placeholder="(11) 9 1234-5678"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Data de nascimento</label>
                      <input
                        value={form.birthDate}
                        inputMode="numeric"
                        onChange={(e) => set("birthDate", maskDate(e.target.value))}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className={labelCls}>
                      Bio{" "}
                      <span className="font-normal text-gray-400">
                        ({form.bio.length}/300)
                      </span>
                    </label>
                    <textarea
                      value={form.bio}
                      maxLength={300}
                      rows={3}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder="Fale um pouco sobre você..."
                      className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── Localização ───────────────────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    📍 Localização
                  </h2>
                </div>
                <div className="p-5">
                  <label className={labelCls}>Cidade</label>
                  <div className="relative">
                    <input
                      value={cityQuery}
                      onChange={(e) => handleCityInput(e.target.value)}
                      onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
                      placeholder="Ex: Joinville"
                      autoComplete="off"
                      className={inputCls}
                    />
                    {cityLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin inline-block" />
                    )}
                    {citySuggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {citySuggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => selectCity(c)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <span className="font-semibold text-gray-900">{c.nome}</span>
                            <span className="text-gray-400 ml-2">— {c.uf}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.city && form.state && (
                    <p className="text-[12px] text-[#00e87a] font-semibold mt-1.5">
                      ✓ {form.city} — {form.state}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Redes Sociais ─────────────────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    🌐 Redes Sociais
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelCls}>Instagram</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">@</span>
                      <input
                        value={form.instagramUrl}
                        maxLength={100}
                        onChange={(e) => set("instagramUrl", e.target.value)}
                        placeholder="seuhandle"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Twitter / X</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">@</span>
                      <input
                        value={form.twitterUrl}
                        maxLength={100}
                        onChange={(e) => set("twitterUrl", e.target.value)}
                        placeholder="seuhandle"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>{/* fim coluna esquerda */}

            {/* ── Coluna direita ────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* ── Esportes ──────────────────────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    🎾 Esportes que pratica
                  </h2>
                  <p className="text-[12px] text-gray-400 mt-0.5 font-normal">Selecione todos que se aplicam</p>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-2">
                    {SPORTS_OPTIONS.map(({ value, label, icon }) => {
                      const active = form.sports.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleSport(value)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] text-sm font-bold transition-all duration-150 ${
                            active
                              ? "bg-[#00e87a]/10 border-[#00e87a]/30 text-gray-900"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-lg">{icon}</span>
                          {label}
                          {active && <span className="ml-auto text-[#00e87a] text-lg">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Equipamento ───────────────────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                    🏸 Equipamento
                  </h2>
                  <p className="text-[12px] text-gray-400 mt-0.5 font-normal">Adicione até 3 raquetes</p>
                </div>
                <div className="p-5 space-y-3">
                  {form.rackets.map((racket, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        list="racket-brands"
                        value={racket}
                        maxLength={60}
                        onChange={(e) => {
                          const updated = [...form.rackets];
                          updated[idx] = e.target.value;
                          setForm((f) => ({ ...f, rackets: updated }));
                        }}
                        placeholder="Ex: Nox ML10, Babolat Viper..."
                        className={inputCls + " flex-1"}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, rackets: f.rackets.filter((_, i) => i !== idx) }))}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0 text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {form.rackets.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rackets: [...f.rackets, ""] }))}
                      className="w-full py-2.5 border-[1.5px] border-dashed border-gray-300 rounded-xl text-[13px] font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    >
                      + Adicionar raquete
                    </button>
                  )}
                  <datalist id="racket-brands">
                    {RACKET_BRANDS.map((b) => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </div>

              {/* ── Patrocinadores ────────────────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                      🏅 Patrocinadores
                    </h2>
                    <p className="text-[12px] text-gray-400 mt-0.5 font-normal">Máximo de 10</p>
                  </div>
                  {sponsors.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setSponsorOpen((v) => !v)}
                      className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {sponsorOpen ? "Cancelar" : "+ Adicionar"}
                    </button>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  {sponsors.length === 0 && !sponsorOpen && (
                    <p className="text-[13px] text-gray-400 text-center py-2">Nenhum patrocinador adicionado.</p>
                  )}
                  {sponsors.map((sp) => (
                    <div key={sp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {sp.logoUrl ? (
                        <img src={sp.logoUrl} alt={sp.name} className="w-9 h-9 rounded-lg object-contain bg-white border border-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-lg flex-shrink-0">🏅</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 truncate">{sp.name}</p>
                        {sp.websiteUrl && (
                          <p className="text-[11px] text-blue-500 truncate font-normal">{sp.websiteUrl}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSponsor(sp.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {sponsorOpen && (
                    <div className="space-y-2 pt-1 border-t border-gray-100">
                      <input
                        value={sponsorForm.name}
                        onChange={(e) => setSponsorForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Nome do patrocinador *"
                        maxLength={80}
                        className={inputCls}
                      />
                      <input
                        value={sponsorForm.logoUrl}
                        onChange={(e) => setSponsorForm((f) => ({ ...f, logoUrl: e.target.value }))}
                        placeholder="URL do logo (opcional)"
                        type="url"
                        className={inputCls}
                      />
                      <input
                        value={sponsorForm.websiteUrl}
                        onChange={(e) => setSponsorForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                        placeholder="Website (opcional)"
                        type="url"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={addSponsor}
                        disabled={sponsorAdding || !sponsorForm.name.trim()}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-extrabold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {sponsorAdding && (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        )}
                        Salvar patrocinador
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>{/* fim coluna direita */}
          </div>{/* fim grid */}

          {/* ── Ações ─────────────────────────────────────────────────────── */}
          <div className="flex gap-3">
            <Link
              to="/athlete/profile"
              className="flex-1 py-3 text-center border border-gray-200 rounded-xl text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-[#00e87a] text-[#0a0e1a] rounded-xl text-[14px] font-extrabold hover:bg-[#00ff88] hover:shadow-[0_0_16px_rgba(0,232,122,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-[#0a0e1a]/20 border-t-[#0a0e1a] rounded-full animate-spin inline-block" />
              )}
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </main>

      {/* ── Bottom Nav ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe z-50">
        <div className="flex">
          <Link to="/athlete/dashboard" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99]">
            <span className="text-xl leading-none">🏠</span>Início
          </Link>
          <Link to="/tournaments" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99]">
            <span className="text-xl leading-none">🎾</span>Torneios
          </Link>
          <Link to="/athlete/profile" state={{ tab: "trophies" }} className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99]">
            <span className="text-xl leading-none">🏆</span>Troféus
          </Link>
          <Link to="/athlete/profile" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#00e87a]">
            <span className="text-xl leading-none">👤</span>Perfil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AthleteEditProfile;
