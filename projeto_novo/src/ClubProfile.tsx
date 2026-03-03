import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";

// ─── mock ─────────────────────────────────────────────────
const CLUB = {
  name: "Clube de Teste",
  initials: "CT",
  rating: 4.9,
  reviews: 156,
  location: "Vancouver, SP",
  phone: "(11) 9 9999-9999",
  email: "contato@clubeelite.com",
  description:
    "Um clube com excelente infraestrutura e ambiente acolhedor para todos os níveis de jogadores. Oferecemos quadras de alta qualidade, aulas profissionais e torneios regulares.",
  instagram: "@clubeelitepadel",
  website: "www.clubeelite.com.br",
  tournamentCount: 15,
  participantCount: 450,
  memberCount: 120,
  yearOfExperience: 12,
  tournamentsCompleted: "150+",
  occupancyRate: "95%",
  activeMembersRate: "85%",
  logoUrl: null as string | null,
};

const TOURNAMENTS = [
  {
    id: "1",
    name: "Copa Verão 2024",
    participants: 32,
    date: "14/03/2024",
    status: "Concluído" as const,
  },
  {
    id: "2",
    name: "Torneio Iniciantes",
    participants: 24,
    date: "19/03/2024",
    status: "Em Andamento" as const,
  },
  {
    id: "3",
    name: "Championship Elite",
    participants: 48,
    date: "04/04/2024",
    status: "Inscrições Abertas" as const,
  },
  {
    id: "4",
    name: "Torneio Relâmpago",
    participants: 16,
    date: "28/03/2024",
    status: "Inscrições Abertas" as const,
  },
];

const SERVICES = [
  { label: "Quadras Cobertas", value: "6", icon: "🎾" },
  { label: "Quadras Descobertas", value: "0", icon: "☀️" },
  { label: "Vestiários", value: "Completos", icon: "🚿" },
  { label: "Estacionamento", value: "80 vagas", icon: "🚗" },
  { label: "Bar/Restaurante", value: "Sim", icon: "🍽️" },
  { label: "Wi-Fi", value: "Grátis", icon: "📶" },
];

const RECENT_ACTIVITY = [
  {
    id: "1",
    type: "tournament",
    message: "Novo torneio criado",
    detail: "Championship Elite",
    time: "2h atrás",
  },
  {
    id: "2",
    type: "member",
    message: "Nova dupla inscrita",
    detail: "Rafael & Beatriz",
    time: "5h atrás",
  },
  {
    id: "3",
    type: "payment",
    message: "Pagamento confirmado",
    detail: "R$ 150,00",
    time: "1d atrás",
  },
  {
    id: "4",
    type: "result",
    message: "Resultado registrado",
    detail: "Quadra 1 - 6/4 6/3",
    time: "1d atrás",
  },
];

// ─── helpers ──────────────────────────────────────────────
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

// ─── page ─────────────────────────────────────────────────
const ClubProfile = () => {
  const [logoFile, setLogoFile] = useState<string | null>(CLUB.logoUrl);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader activePage="dashboard" />

      <main className="pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Perfil do Clube
            </h1>
            <p className="text-gray-600">
              Visualize e gerencie as informações do seu clube
            </p>
          </div>

          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT SIDEBAR - Club Info */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Club Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                {/* Logo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl overflow-hidden">
                      {logoFile ? (
                        <img
                          src={logoFile}
                          alt={CLUB.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Upload Overlay */}
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
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Club Name & Rating */}
                <div className="text-center mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {CLUB.name}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <svg
                      className="w-5 h-5 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-gray-900">
                      {CLUB.rating}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {CLUB.reviews} avaliações
                  </p>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Telefone
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {CLUB.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      E-mail
                    </p>
                    <p className="text-sm font-semibold text-gray-900 break-all">
                      {CLUB.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Localização
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {CLUB.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Instagram
                    </p>
                    <a
                      href={`https://instagram.com/${CLUB.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {CLUB.instagram}
                    </a>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Website
                    </p>
                    <a
                      href={`https://${CLUB.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all"
                    >
                      {CLUB.website}
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-base text-gray-900 mb-4">
                  Estatísticas Rápidas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Tempo de atividade
                    </span>
                    <span className="font-bold text-gray-900">
                      {CLUB.yearOfExperience} anos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Taxa de ocupação
                    </span>
                    <span className="font-bold text-emerald-600">
                      {CLUB.occupancyRate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Membros ativos
                    </span>
                    <span className="font-bold text-blue-600">
                      {CLUB.activeMembersRate}
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            {/* CENTER - Main Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-50 p-2.5 rounded-lg">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Torneios</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {CLUB.tournamentsCompleted}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-emerald-50 p-2.5 rounded-lg">
                      <svg
                        className="w-5 h-5 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Participantes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {CLUB.participantCount}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-50 p-2.5 rounded-lg">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Membros</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {CLUB.memberCount}
                  </p>
                </div>
              </div>

              {/* About */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-base text-gray-900 mb-3">
                  Sobre o Clube
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {CLUB.description}
                </p>
              </div>

              {/* Estrutura */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-base text-gray-900 mb-4">
                  Infraestrutura
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {SERVICES.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="text-2xl flex-shrink-0">
                        {service.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {service.label}
                        </p>
                        <p className="text-xs text-gray-600">{service.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Torneios */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-gray-900">
                    Torneios Ativos
                  </h3>
                  <Link
                    to="/dashboard/tournaments"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ver todos
                  </Link>
                </div>

                <div className="space-y-3">
                  {TOURNAMENTS.map((tournament) => {
                    const statusConfig = STATUS_CONFIG[tournament.status];
                    return (
                      <Link
                        key={tournament.id}
                        to={`/tournaments/${tournament.id}`}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">
                            {tournament.name}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
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
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {tournament.date}
                            </span>
                            <span className="flex items-center gap-1">
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
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                              </svg>
                              {tournament.participants}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                          />
                          {tournament.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR - Actions & Activity */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-base text-gray-900 mb-4">
                  Ações Rápidas
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/dashboard/tournaments/create"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 shadow-sm hover:shadow transition-all"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Criar Torneio
                  </Link>

                  <Link
                    to="/dashboard/members"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Membros
                  </Link>

                  <Link
                    to="/dashboard/settings"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Configurações
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-base text-gray-900 mb-4">
                  Atividades Recentes
                </h3>
                <div className="space-y-4">
                  {RECENT_ACTIVITY.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          activity.type === "tournament"
                            ? "bg-blue-500"
                            : activity.type === "member"
                              ? "bg-emerald-500"
                              : activity.type === "payment"
                                ? "bg-green-500"
                                : "bg-purple-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {activity.detail}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 mb-2">
                    Precisa de ajuda?
                  </h4>
                  <p className="text-xs text-gray-600 mb-4">
                    Entre em contato com nosso suporte
                  </p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
                    Falar com Suporte
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClubProfile;
