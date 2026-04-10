import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import { ClubService } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClubData {
  id: string;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  state?: string | null;
  courts?: string[];
  matchDuration?: number;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> =
  {
    Concluído: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    "Em Andamento": {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    "Inscrições Abertas": {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
  };

// ─── Component ────────────────────────────────────────────────────────────────

const ClubDashboardProfile = () => {
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<string | null>(null);

  useEffect(() => {
    ClubService.getProfile()
      .then((data) => {
        setClub(data);
        setLogoFile(data.logoUrl ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <DashboardHeader activePage="dashboard" />
        <main className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-xl w-48 mb-8 mt-2" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 h-64" />
              <div className="lg:col-span-9 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 h-40" />
                <div className="bg-white rounded-2xl border border-gray-200 h-32" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <DashboardHeader activePage="dashboard" />
        <div className="pt-24 text-center text-gray-500">
          Erro ao carregar perfil do clube.
        </div>
      </div>
    );
  }

  const initials = club.name?.slice(0, 2).toUpperCase() ?? "CB";
  const location = [club.city, club.state].filter(Boolean).join(", ") || "—";
  const courtsCount = club.courts?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <DashboardHeader activePage="dashboard" />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-0.5">
                Perfil do Clube
              </h1>
              <p className="text-sm text-gray-500 font-normal">
                Visualize as informações do seu clube
              </p>
            </div>
            <Link
              to="/dashboard/settings"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Editar Configurações
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT SIDEBAR */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Club Card */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                {/* Logo */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl overflow-hidden">
                      {logoFile ? (
                        <img
                          src={logoFile}
                          alt={club.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl font-black text-gray-400">
                            {initials}
                          </span>
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </div>
                  <h2 className="mt-4 text-[16px] font-extrabold text-gray-900 text-center tracking-tight">
                    {club.name}
                  </h2>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    {location}
                  </p>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  {club.phone && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                        Telefone
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {club.phone}
                      </p>
                    </div>
                  )}
                  {club.cnpj && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                        CNPJ
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {club.cnpj}
                      </p>
                    </div>
                  )}
                  {courtsCount > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                        Quadras
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {courtsCount} quadra{courtsCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                  {club.matchDuration && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                        Duração dos jogos
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {club.matchDuration} min
                      </p>
                    </div>
                  )}
                </div>

                {/* Public profile link */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to={`/clubs/${club.id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Ver perfil público
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Ações Rápidas
                </h3>
                <div className="space-y-2">
                  <Link
                    to="/dashboard/tournaments/create"
                    className="flex items-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
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
                    Criar Torneio
                  </Link>
                  <Link
                    to="/dashboard/tournaments"
                    className="flex items-center gap-2 w-full px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-colors"
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Meus Torneios
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-2 w-full px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-colors"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Configurações
                  </Link>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="lg:col-span-9 space-y-6">
              {/* Club Info */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight mb-4">
                  Informações do Clube
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Nome
                    </p>
                    <p className="font-bold text-gray-900 text-[14px]">
                      {club.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Localização
                    </p>
                    <p className="font-bold text-gray-900 text-[14px]">
                      {location}
                    </p>
                  </div>
                  {club.phone && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Telefone
                      </p>
                      <p className="font-bold text-gray-900 text-[14px]">
                        {club.phone}
                      </p>
                    </div>
                  )}
                  {club.cnpj && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        CNPJ
                      </p>
                      <p className="font-bold text-gray-900 text-[14px]">
                        {club.cnpj}
                      </p>
                    </div>
                  )}
                  {courtsCount > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Quadras
                      </p>
                      <p className="font-bold text-gray-900 text-[14px]">
                        {courtsCount} quadra{courtsCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                  {club.matchDuration && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Duração padrão
                      </p>
                      <p className="font-bold text-gray-900 text-[14px]">
                        {club.matchDuration} min
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Courts */}
              {club.courts && club.courts.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight mb-4">
                    Quadras
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {club.courts.map((court, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {court}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule defaults */}
              {(club.defaultStartTime || club.defaultEndTime) && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight mb-4">
                    Horários Padrão
                  </h2>
                  <div className="flex gap-8">
                    {club.defaultStartTime && (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                          Início
                        </p>
                        <p className="font-bold text-gray-900 text-[14px]">
                          {club.defaultStartTime}
                        </p>
                      </div>
                    )}
                    {club.defaultEndTime && (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                          Fim
                        </p>
                        <p className="font-bold text-gray-900 text-[14px]">
                          {club.defaultEndTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClubDashboardProfile;
