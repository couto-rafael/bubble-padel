import React from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";

// ─── SEÇÕES DE CONFIGURAÇÃO ───────────────────────────────────────────────────

interface SettingItem {
  label: string;
  description: string;
  icon: string;
  action?: string;
  danger?: boolean;
  disabled?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

const SECTIONS: SettingSection[] = [
  {
    title: "Conta",
    items: [
      {
        icon: "✉️",
        label: "Alterar e-mail",
        description: "Atualizar o endereço de e-mail da conta",
        disabled: true,
      },
      {
        icon: "🔒",
        label: "Alterar senha",
        description: "Definir uma nova senha de acesso",
        disabled: true,
      },
      {
        icon: "🗑️",
        label: "Excluir conta",
        description: "Remover permanentemente sua conta e dados",
        danger: true,
        disabled: true,
      },
    ],
  },
  {
    title: "Privacidade",
    items: [
      {
        icon: "👁️",
        label: "Visibilidade do perfil",
        description: "Controlar quem pode ver seu perfil público",
        disabled: true,
      },
      {
        icon: "📊",
        label: "Visibilidade dos resultados",
        description: "Mostrar ou ocultar seus resultados no perfil",
        disabled: true,
      },
    ],
  },
  {
    title: "Notificações",
    items: [
      {
        icon: "🔔",
        label: "Torneios na sua cidade",
        description: "Receber avisos de novos torneios próximos",
        disabled: true,
      },
      {
        icon: "📋",
        label: "Resultados publicados",
        description: "Notificar quando um resultado for publicado",
        disabled: true,
      },
      {
        icon: "✅",
        label: "Inscrição confirmada",
        description: "Confirmar sua inscrição em torneios",
        disabled: true,
      },
    ],
  },
  {
    title: "Dados",
    items: [
      {
        icon: "📥",
        label: "Exportar meus dados",
        description: "Baixar todos os seus dados (LGPD)",
        disabled: true,
      },
    ],
  },
];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

// Coluna esquerda: Conta + Dados
const LEFT_SECTIONS = ["Conta", "Dados"];
// Coluna direita: Privacidade + Notificações
const RIGHT_SECTIONS = ["Privacidade", "Notificações"];

function SectionCard({ section }: { section: SettingSection }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-wider">
          {section.title}
        </h2>
      </div>
      <div className="divide-y divide-gray-50">
        {section.items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-4 px-5 py-4 ${item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"} transition-colors`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${item.danger ? "bg-red-50" : "bg-gray-100"}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] font-bold ${item.danger ? "text-red-600" : "text-gray-900"}`}>
                {item.label}
              </p>
              <p className="text-[12px] text-gray-500 font-normal">{item.description}</p>
            </div>
            {item.disabled ? (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0">
                Em breve
              </span>
            ) : (
              <span className="text-gray-400">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const AthleteSettings: React.FC = () => {
  const leftSections = SECTIONS.filter((s) => LEFT_SECTIONS.includes(s.title));
  const rightSections = SECTIONS.filter((s) => RIGHT_SECTIONS.includes(s.title));

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-8">
      <AthleteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">

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
              Configurações
            </h1>
            <p className="text-[13px] text-gray-500 font-normal">
              Conta, privacidade e notificações
            </p>
          </div>
        </div>

        {/* Link rápido — Editar Perfil (largura total) */}
        <Link
          to="/athlete/profile/edit"
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 hover:bg-gray-50 transition-colors group"
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

        {/* Grid 2 colunas no desktop */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Coluna esquerda — Conta + Dados */}
          <div className="space-y-4">
            {leftSections.map((section) => (
              <SectionCard key={section.title} section={section} />
            ))}
          </div>
          {/* Coluna direita — Privacidade + Notificações */}
          <div className="space-y-4">
            {rightSections.map((section) => (
              <SectionCard key={section.title} section={section} />
            ))}
          </div>
        </div>

        {/* Versão */}
        <p className="text-center text-[11px] text-gray-400 mt-8">
          Bubble Padel · v1.0
        </p>
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
          <Link to="/athlete/profile" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99]">
            <span className="text-xl leading-none">⚙️</span>Config
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AthleteSettings;
