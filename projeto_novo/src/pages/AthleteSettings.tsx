import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Sport = "PADEL" | "BEACH_TENNIS" | "TENIS" | "PICKLEBALL";

interface IbgeCity {
  id: number;
  nome: string;
  uf: string;
}

interface AthleteForm {
  fullName: string;
  nickname: string;
  phone: string;
  birthDate: string;
  city: string;
  state: string;
  sports: Sport[];
  rackets: string[];
  instagramUrl: string;
  twitterUrl: string;
  avatarUrl: string;
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
  "Babolat",
  "Nox",
  "Adidas",
  "Head",
  "Wilson",
  "Bullpadel",
  "StarVie",
  "Siux",
  "Varlion",
  "Dunlop",
];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const AthleteSettings: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<AthleteForm>({
    fullName: "",
    nickname: "",
    phone: "",
    birthDate: "",
    city: "",
    state: "",
    sports: [],
    rackets: [],
    instagramUrl: "",
    twitterUrl: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<IbgeCity[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityTimer, setCityTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ── Carregar dados atuais ──────────────────────────────────────────────────

  useEffect(() => {
    fetch(`${API_URL}/athlete/profile`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(({ data }) => {
        setCityQuery(
          data.city && data.state
            ? `${data.city} — ${data.state}`
            : (data.city ?? ""),
        );
        setForm({
          fullName: data.fullName ?? "",
          nickname: data.nickname ?? "",
          phone: data.phone ?? "",
          birthDate: data.birthDate
            ? new Date(data.birthDate).toISOString().split("T")[0]
            : "",
          city: data.city ?? "",
          state: data.state ?? "",
          sports: data.sports ?? [],
          rackets: Array.isArray(data.rackets)
            ? data.rackets
            : data.racket
              ? [data.racket]
              : [],
          instagramUrl: data.instagramUrl ?? "",
          twitterUrl: data.twitterUrl ?? "",
          avatarUrl: data.avatarUrl ?? "",
        });
      })
      .catch(() => setError("Erro ao carregar perfil."))
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const set = (field: keyof AthleteForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleSport = (sport: Sport) => {
    setForm((f) => ({
      ...f,
      sports: f.sports.includes(sport)
        ? f.sports.filter((s) => s !== sport)
        : [...f.sports, sport],
    }));
  };

  const handleCityInput = (value: string) => {
    setCityQuery(value);
    setCitySuggestions([]);
    if (cityTimer) clearTimeout(cityTimer);
    if (value.length < 2) return;
    const t = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`,
        );
        const all: Array<{
          id: number;
          nome: string;
          microrregiao: { mesorregiao: { UF: { sigla: string } } };
        }> = await res.json();
        const q = value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const filtered = all
          .filter((m) =>
            m.nome
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .includes(q),
          )
          .slice(0, 8)
          .map((m) => ({
            id: m.id,
            nome: m.nome,
            uf: m.microrregiao.mesorregiao.UF.sigla,
          }));
        setCitySuggestions(filtered);
      } catch {
        /* ignora */
      } finally {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/athlete/profile`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          fullName: form.fullName || undefined,
          nickname: form.nickname || null,
          phone: form.phone || undefined,
          birthDate: form.birthDate || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          sports: form.sports,
          rackets: form.rackets.length > 0 ? form.rackets : [],
          instagramUrl: form.instagramUrl || null,
          twitterUrl: form.twitterUrl || null,
          avatarUrl: form.avatarUrl || undefined,
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-12">
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
          {/* ── Informações pessoais ──────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                Informações Pessoais
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                    Nome completo *
                  </label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                    Apelido
                  </label>
                  <input
                    value={form.nickname}
                    maxLength={30}
                    onChange={(e) => set("nickname", e.target.value)}
                    placeholder="Ex: Rafa, King"
                    className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                    Telefone
                  </label>
                  <input
                    value={form.phone}
                    type="tel"
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                    Data de nascimento
                  </label>
                  <input
                    value={form.birthDate}
                    type="date"
                    onChange={(e) => set("birthDate", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Localização ───────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                📍 Localização
              </h2>
            </div>
            <div className="p-5">
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                Cidade
              </label>
              <div className="relative">
                <input
                  value={cityQuery}
                  onChange={(e) => handleCityInput(e.target.value)}
                  onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
                  placeholder="Ex: Joinville"
                  autoComplete="off"
                  className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
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
                        <span className="font-semibold text-gray-900">
                          {c.nome}
                        </span>
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

          {/* ── Esportes ──────────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                🎾 Esportes que pratica
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5 font-normal">
                Selecione todos que se aplicam
              </p>
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
                      {active && (
                        <span className="ml-auto text-[#00e87a] text-lg">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Equipamento ───────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                🏸 Equipamento
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5 font-normal">
                Adicione até 3 raquetes
              </p>
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        rackets: f.rackets.filter((_, i) => i !== idx),
                      }))
                    }
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {form.rackets.length < 3 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, rackets: [...f.rackets, ""] }))
                  }
                  className="w-full py-2.5 border-[1.5px] border-dashed border-gray-300 rounded-xl text-[13px] font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Adicionar raquete
                </button>
              )}
              <datalist id="racket-brands">
                {RACKET_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* ── Redes Sociais ─────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                🌐 Redes Sociais
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                    @
                  </span>
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
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  Twitter / X
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                    @
                  </span>
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

          {/* ── Foto de perfil ────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                📸 Foto de Perfil
              </h2>
            </div>
            <div className="p-5">
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                URL da foto
              </label>
              <input
                value={form.avatarUrl}
                type="url"
                onChange={(e) => set("avatarUrl", e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Upload direto disponível em breve
              </p>
            </div>
          </div>

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
          <Link
            to="/athlete/dashboard"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99]"
          >
            <span className="text-xl leading-none">🏠</span>Início
          </Link>
          <Link
            to="/tournaments"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99]"
          >
            <span className="text-xl leading-none">🎾</span>Torneios
          </Link>
          <Link
            to="/athlete/profile"
            state={{ tab: "trophies" }}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99]"
          >
            <span className="text-xl leading-none">🏆</span>Troféus
          </Link>
          <Link
            to="/athlete/settings"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#00e87a]"
          >
            <span className="text-xl leading-none">👤</span>Perfil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AthleteSettings;
