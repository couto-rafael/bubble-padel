import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";
import AthleteBottomNav from "../components/AthleteBottomNav";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Visibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE";

interface AthleteSettingsData {
  profileVisibility: Visibility;
  matchHistoryVisibility: Visibility;
  statsVisibility: Visibility;
  searchable: boolean;
  email_registrationConfirmed: boolean;
  email_tournamentReminder: boolean;
  email_resultsPublished: boolean;
  email_newFollower: boolean;
  email_newMessage: boolean;
  email_nearbyTournaments: boolean;
  email_weeklySummary: boolean;
  app_registrationConfirmed: boolean;
  app_tournamentReminder: boolean;
  app_resultsPublished: boolean;
  app_newFollower: boolean;
  app_newMessage: boolean;
  app_nearbyTournaments: boolean;
  app_weeklySummary: boolean;
}

const DEFAULTS: AthleteSettingsData = {
  profileVisibility: "PUBLIC",
  matchHistoryVisibility: "PUBLIC",
  statsVisibility: "PUBLIC",
  searchable: true,
  email_registrationConfirmed: true,
  email_tournamentReminder: true,
  email_resultsPublished: true,
  email_newFollower: false,
  email_newMessage: false,
  email_nearbyTournaments: false,
  email_weeklySummary: false,
  app_registrationConfirmed: true,
  app_tournamentReminder: true,
  app_resultsPublished: true,
  app_newFollower: true,
  app_newMessage: true,
  app_nearbyTournaments: false,
  app_weeklySummary: false,
};

type Tab = "conta" | "privacidade" | "notificacoes";
type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#00e87a]/50 ${checked ? "bg-[#00e87a]" : "bg-gray-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

function VisibilityRadio({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  const options: { value: Visibility; label: string; desc: string }[] = [
    { value: "PUBLIC", label: "Público", desc: "Qualquer pessoa pode ver" },
    { value: "FOLLOWERS", label: "Seguidores", desc: "Somente quem você segue de volta" },
    { value: "PRIVATE", label: "Privado", desc: "Somente você" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${value === opt.value ? "border-[#00e87a] bg-[#00e87a]/5" : "border-gray-200 hover:bg-gray-50"}`}
        >
          <span
            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${value === opt.value ? "border-[#00e87a] bg-[#00e87a]" : "border-gray-300"}`}
          />
          <div>
            <p className="text-[13px] font-bold text-gray-900">{opt.label}</p>
            <p className="text-[11px] text-gray-500">{opt.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function NotifRow({
  label,
  emailKey,
  appKey,
  settings,
  onChange,
}: {
  label: string;
  emailKey: keyof AthleteSettingsData;
  appKey: keyof AthleteSettingsData;
  settings: AthleteSettingsData;
  onChange: (key: keyof AthleteSettingsData, val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0">
      <p className="flex-1 text-[13px] text-gray-800 font-medium">{label}</p>
      <div className="w-14 flex justify-center">
        <Toggle
          checked={settings[emailKey] as boolean}
          onChange={(v) => onChange(emailKey, v)}
        />
      </div>
      <div className="w-14 flex justify-center">
        <Toggle
          checked={settings[appKey] as boolean}
          onChange={(v) => onChange(appKey, v)}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AthleteSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("privacidade");
  const [settings, setSettings] = useState<AthleteSettingsData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    fetch(`${API_URL}/athlete/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setSettings({ ...DEFAULTS, ...json.data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((data: AthleteSettingsData) => {
    setSaveState("saving");
    const token = localStorage.getItem("auth_token");
    fetch(`${API_URL}/athlete/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      })
      .catch(() => {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
      });
  }, []);

  const update = (patch: Partial<AthleteSettingsData>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(next), 800);
  };

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "conta", label: "Conta" },
    { id: "privacidade", label: "Privacidade" },
    { id: "notificacoes", label: "Notificações" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/athlete/profile"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            ←
          </Link>
          <div className="flex-1">
            <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
              Configurações
            </h1>
            <p className="text-[13px] text-gray-500 font-normal">
              Conta, privacidade e notificações
            </p>
          </div>
          {/* Save indicator */}
          <div className="h-7 flex items-center">
            {saveState === "saving" && (
              <span className="text-[12px] text-gray-400 flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                Salvando…
              </span>
            )}
            {saveState === "saved" && (
              <span className="text-[12px] text-[#00a85a] font-semibold">Salvo</span>
            )}
            {saveState === "error" && (
              <span className="text-[12px] text-red-500 font-semibold">Erro ao salvar</span>
            )}
          </div>
        </div>

        {/* Edit Profile shortcut */}
        <Link
          to="/athlete/profile/edit"
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm mb-5 hover:bg-gray-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00e87a]/10 flex items-center justify-center text-xl flex-shrink-0">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-extrabold text-gray-900">Editar Perfil</p>
            <p className="text-[12px] text-gray-500 font-normal">
              Nome, foto, bio, esportes, raquetes e patrocinadores
            </p>
          </div>
          <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
        </Link>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-colors ${activeTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── CONTA ────────────────────────────────────────────────────── */}
            {activeTab === "conta" && (
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Conta
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { icon: "✉️", label: "Alterar e-mail", desc: "Atualizar o endereço de e-mail da conta" },
                      { icon: "🔒", label: "Alterar senha", desc: "Definir uma nova senha de acesso" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-4 px-5 py-4 opacity-50 cursor-not-allowed"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-gray-900">{item.label}</p>
                          <p className="text-[12px] text-gray-500">{item.desc}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0">
                          Em breve
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Dados
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    <div className="flex items-center gap-4 px-5 py-4 opacity-50 cursor-not-allowed">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                        📥
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-gray-900">Exportar meus dados</p>
                        <p className="text-[12px] text-gray-500">Baixar todos os seus dados (LGPD)</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0">
                        Em breve
                      </span>
                    </div>
                    <div className="flex items-center gap-4 px-5 py-4 opacity-50 cursor-not-allowed">
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-lg flex-shrink-0">
                        🗑️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-red-600">Excluir conta</p>
                        <p className="text-[12px] text-gray-500">
                          Remover permanentemente sua conta e dados
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0">
                        Em breve
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PRIVACIDADE ──────────────────────────────────────────────── */}
            {activeTab === "privacidade" && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Visibilidade do perfil
                    </h2>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Quem pode ver sua página pública de atleta
                    </p>
                  </div>
                  <div className="p-4">
                    <VisibilityRadio
                      value={settings.profileVisibility}
                      onChange={(v) => update({ profileVisibility: v })}
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Histórico de partidas
                    </h2>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Quem pode ver seus resultados e placares
                    </p>
                  </div>
                  <div className="p-4">
                    <VisibilityRadio
                      value={settings.matchHistoryVisibility}
                      onChange={(v) => update({ matchHistoryVisibility: v })}
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Estatísticas
                    </h2>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Quem pode ver suas estatísticas (vitórias, títulos, etc.)
                    </p>
                  </div>
                  <div className="p-4">
                    <VisibilityRadio
                      value={settings.statsVisibility}
                      onChange={(v) => update({ statsVisibility: v })}
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-900">
                        Aparecer em buscas
                      </p>
                      <p className="text-[12px] text-gray-500">
                        Permitir que outros atletas encontrem você pelo nome
                      </p>
                    </div>
                    <Toggle
                      checked={settings.searchable}
                      onChange={(v) => update({ searchable: v })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICAÇÕES ─────────────────────────────────────────────── */}
            {activeTab === "notificacoes" && (
              <div className="space-y-4">
                {/* Column headers */}
                <div className="flex items-center gap-4 px-1">
                  <div className="flex-1" />
                  <div className="w-14 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Email
                  </div>
                  <div className="w-14 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    App
                  </div>
                </div>

                {/* Torneios */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Torneios
                    </h2>
                  </div>
                  <div className="px-5">
                    <NotifRow
                      label="Inscrição confirmada"
                      emailKey="email_registrationConfirmed"
                      appKey="app_registrationConfirmed"
                      settings={settings}
                      onChange={(k, v) => update({ [k]: v })}
                    />
                    <NotifRow
                      label="Lembrete de torneio"
                      emailKey="email_tournamentReminder"
                      appKey="app_tournamentReminder"
                      settings={settings}
                      onChange={(k, v) => update({ [k]: v })}
                    />
                    <NotifRow
                      label="Resultados publicados"
                      emailKey="email_resultsPublished"
                      appKey="app_resultsPublished"
                      settings={settings}
                      onChange={(k, v) => update({ [k]: v })}
                    />
                    <NotifRow
                      label="Torneios perto de mim"
                      emailKey="email_nearbyTournaments"
                      appKey="app_nearbyTournaments"
                      settings={settings}
                      onChange={(k, v) => update({ [k]: v })}
                    />
                  </div>
                </div>

                {/* Social */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Social
                    </h2>
                  </div>
                  <div className="px-5">
                    <NotifRow
                      label="Novo seguidor"
                      emailKey="email_newFollower"
                      appKey="app_newFollower"
                      settings={settings}
                      onChange={(k, v) => update({ [k]: v })}
                    />
                    <NotifRow
                      label="Nova mensagem"
                      emailKey="email_newMessage"
                      appKey="app_newMessage"
                      settings={settings}
                      onChange={(k, v) => update({ [k]: v })}
                    />
                  </div>
                </div>

                {/* Resumo */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      Resumo
                    </h2>
                  </div>
                  <div className="px-5">
                    <NotifRow
                      label="Resumo semanal"
                      emailKey="email_weeklySummary"
                      appKey="app_weeklySummary"
                      settings={settings}
                      onChange={(k, v) => update({ [k]: v })}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 text-center px-4">
                  Notificações in-app aparecem no sino do menu. Emails são enviados para o
                  endereço da sua conta.
                </p>
              </div>
            )}
          </>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-8">
          Bubble Padel · v1.0
        </p>
      </main>

      <AthleteBottomNav />
    </div>
  );
}
