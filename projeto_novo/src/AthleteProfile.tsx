import React from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "./AthleteHeader";

const AthleteProfile: React.FC = () => {
  // Dados mockados
  const recentMatches = [
    {
      id: 1,
      opponents: "Maria & Pedro",
      score: "6-4, 6-3",
      result: "Vitória",
      date: "14/03/2024",
      isWin: true,
    },
    {
      id: 2,
      opponents: "Ana & Carlos",
      score: "4-6, 6-7",
      result: "Derrota",
      date: "11/03/2024",
      isWin: false,
    },
    {
      id: 3,
      opponents: "Lucas & João",
      score: "6-2, 6-1",
      result: "Vitória",
      date: "09/03/2024",
      isWin: true,
    },
  ];

  const achievements = [
    { id: 1, name: "Jogador da Semana", icon: "🏆" },
    { id: 2, name: "Mestre do Padel", icon: "🥇" },
    { id: 3, name: "Veterano", icon: "🎖️" },
  ];

  const friends = [
    { id: 1, avatar: "https://i.pravatar.cc/150?img=1" },
    { id: 2, avatar: "https://i.pravatar.cc/150?img=2" },
    { id: 3, avatar: "https://i.pravatar.cc/150?img=3" },
    { id: 4, avatar: "https://i.pravatar.cc/150?img=4" },
    { id: 5, avatar: "https://i.pravatar.cc/150?img=5" },
    { id: 6, avatar: "https://i.pravatar.cc/150?img=6" },
    { id: 7, avatar: "https://i.pravatar.cc/150?img=7" },
    { id: 8, avatar: "https://i.pravatar.cc/150?img=8" },
  ];

  // Gerar heatmap (12 semanas = 84 dias)
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const games = Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0;

      data.push({
        date,
        games,
        intensity:
          games === 0
            ? 0
            : games === 1
              ? 1
              : games === 2
                ? 2
                : games === 3
                  ? 3
                  : 4,
      });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return "bg-gray-100";
      case 1:
        return "bg-[#00ff88]/30";
      case 2:
        return "bg-[#00ff88]/50";
      case 3:
        return "bg-[#00ff88]/70";
      case 4:
        return "bg-[#00ff88]";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AthleteHeader />

      {/* Main Content - 3 COLUNAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUNA 1 - Profile Card (esquerda) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-8">
              {/* Banner superior verde */}
              <div className="relative h-24 bg-gradient-to-r from-[#00ff88]/30 to-[#00cc6a]/30">
                <button className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-sm">
                  <svg
                    className="w-4 h-4 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="relative -mt-12 mb-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center mx-auto shadow-sm">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h2 className="text-xl font-black text-gray-900">
                      João Silva
                    </h2>
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm italic mb-1">
                    "Joãozinho"
                  </p>
                  <p className="text-gray-600 text-sm mb-2">@joaosilva</p>
                  <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-2">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    São Paulo, SP 🇧🇷
                  </div>
                  <div className="flex items-center justify-center gap-1 text-gray-500 text-xs">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Membro desde dezembro de 2023
                  </div>
                </div>

                {/* Bio */}
                <p className="text-center text-gray-600 text-sm mb-4 px-2">
                  Jogador de padel apaixonado pelo esporte. Sempre em busca de
                  novos desafios e parceiros para jogar.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900 mb-1">45</p>
                    <p className="text-gray-500 text-xs">Jogos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900 mb-1">
                      150
                    </p>
                    <p className="text-gray-500 text-xs">Amigos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900 mb-1">12</p>
                    <p className="text-gray-500 text-xs">Torneios</p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  <button className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </button>
                  <button className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 448 512"
                    >
                      <path d="M448 209.91a210.06 210.06 0 01-122.77-39.25V349.38A162.55 162.55 0 11185 188.31V278.2a74.62 74.62 0 1052.23 71.18V0l88 0a121.18 121.18 0 001.86 22.17h0A122.18 122.18 0 00381 102.39a121.43 121.43 0 0067 20.14Z" />
                    </svg>
                  </button>
                  <button className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Esportes */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-gray-900 font-bold mb-2 text-sm">
                    Esportes
                  </h3>
                  <div className="inline-block px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg">
                    <span className="text-[#00cc6a] font-semibold text-xs">
                      Padel
                    </span>
                  </div>
                </div>

                {/* Raquetes */}
                <div className="mb-4">
                  <h3 className="text-gray-900 font-bold mb-2 text-sm">
                    Raquetes
                  </h3>
                  <div className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg">
                    <span className="text-gray-700 text-xs">Nox</span>
                  </div>
                </div>

                {/* Botão Editar */}
                <button className="w-full py-2.5 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-white rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-sm">
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA 2 - Conquistas + Partidas (centro) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Conquistas Recentes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-black text-gray-900 mb-6">
                Conquistas Recentes
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="text-center">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <p className="text-gray-600 text-xs">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Partidas Recentes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-black text-gray-900 mb-6">
                Partidas Recentes
              </h3>
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border ${match.isWin ? "bg-[#00ff88]/5 border-[#00ff88]/20" : "bg-red-50 border-red-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900 font-semibold text-sm mb-0.5">
                          vs {match.opponents}
                        </p>
                        <p className="text-gray-500 text-xs">{match.score}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-sm mb-0.5 ${match.isWin ? "text-[#00cc6a]" : "text-red-500"}`}
                        >
                          {match.result}
                        </p>
                        <p className="text-gray-400 text-xs">{match.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amigos */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900">Amigos</h3>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {friends.map((friend) => (
                  <div key={friend.id}>
                    <img
                      src={friend.avatar}
                      alt="Friend"
                      className="w-full aspect-square rounded-full border-2 border-gray-200"
                    />
                  </div>
                ))}
              </div>

              <p className="text-center text-gray-500 text-xs">150 amigos</p>
            </div>

            {/* Patrocinadores */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-black text-gray-900 mb-6">
                Patrocinadores
              </h3>
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm mb-1">
                  Nenhum patrocinador ainda
                </p>
                <p className="text-gray-400 text-xs">
                  Continue jogando para atrair patrocinadores!
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA 3 - Sala de Troféus + Estatísticas + Atividade (direita) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sala de Troféus */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <h3 className="text-lg font-black text-gray-900">
                  Sala de Troféus
                </h3>
              </div>
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Nenhum troféu ainda</p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-black text-gray-900 mb-6">
                Estatísticas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">
                    Partidas Jogadas
                  </span>
                  <span className="text-gray-900 font-bold">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Vitórias</span>
                  <span className="text-[#00cc6a] font-bold">30</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Taxa de Vitória</span>
                  <span className="text-[#00cc6a] font-bold">66.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Torneios</span>
                  <span className="text-gray-900 font-bold">12</span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Vitórias</span>
                    <span className="text-[#00cc6a] font-bold text-sm">
                      73%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a]"
                      style={{ width: "73%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">
                      Games Vencidos
                    </span>
                    <span className="text-blue-500 font-bold text-sm">63%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: "63%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Atividade de Jogos */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-black text-gray-900 mb-6">
                Atividade de Jogos
              </h3>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">Semana</p>
                  <p className="text-3xl font-black text-purple-500">3</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">Mês</p>
                  <p className="text-3xl font-black text-purple-500">12</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">Taxa</p>
                  <p className="text-3xl font-black text-[#00cc6a]">66.7%</p>
                </div>
              </div>

              {/* Heatmap */}
              <div>
                <p className="text-gray-500 text-xs mb-3">Últimas 12 semanas</p>
                <div className="grid grid-cols-12 gap-1.5">
                  {heatmapData.map((day, index) => (
                    <div
                      key={index}
                      className={`aspect-square ${getIntensityColor(day.intensity)} rounded hover:ring-2 hover:ring-[#00ff88] transition-all cursor-pointer`}
                      title={`${day.date.toLocaleDateString("pt-BR")} - ${day.games} jogo${day.games !== 1 ? "s" : ""}`}
                    ></div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <span>Menos</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <div className="w-3 h-3 bg-[#00ff88]/30 rounded"></div>
                    <div className="w-3 h-3 bg-[#00ff88]/50 rounded"></div>
                    <div className="w-3 h-3 bg-[#00ff88]/70 rounded"></div>
                    <div className="w-3 h-3 bg-[#00ff88] rounded"></div>
                  </div>
                  <span>Mais</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthleteProfile;
