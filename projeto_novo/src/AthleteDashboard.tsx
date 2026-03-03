import React from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "./AthleteHeader";

const AthleteDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1540] to-[#0a0e27]">
      <AthleteHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white mb-2">
            Bem-vindo de volta! 👋
          </h2>
          <p className="text-gray-400">
            Aqui está um resumo da sua atividade recente
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00cc6a]/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#00ff88]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <span className="text-[#00ff88] text-sm font-semibold">+12%</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">45</h3>
            <p className="text-gray-400 text-sm">Jogos Disputados</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-400"
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
              </div>
              <span className="text-purple-400 text-sm font-semibold">+3</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">150</h3>
            <p className="text-gray-400 text-sm">Amigos Conectados</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
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
              </div>
              <span className="text-blue-400 text-sm font-semibold">Ativo</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">12</h3>
            <p className="text-gray-400 text-sm">Torneios Inscritos</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-400"
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
              <span className="text-amber-400 text-sm font-semibold">#1</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">73%</h3>
            <p className="text-gray-400 text-sm">Taxa de Vitórias</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed de Atividades */}
          <div className="lg:col-span-2 space-y-6">
            {/* Call to Action - Primeiro Jogo */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-[#00ff88]/30 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88]/20 to-[#00cc6a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#00ff88]"
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
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                Crie seu primeiro jogo
              </h3>
              <p className="text-gray-400 mb-6">
                Registre suas partidas e acompanhe sua evolução no esporte.
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e27] rounded-lg font-bold transition-all hover:scale-[1.02] shadow-lg">
                <span className="flex items-center gap-2">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Adicionar Jogo
                </span>
              </button>
            </div>

            {/* Próximos Torneios */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">
                  Próximos Torneios
                </h3>
                <Link
                  to="/torneos"
                  className="text-[#00ff88] text-sm font-semibold hover:text-[#00dd77] transition-colors"
                >
                  Ver todos →
                </Link>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0a0e27]/50 rounded-lg p-4 border border-white/5 hover:border-[#00ff88]/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white mb-1">
                        Torneio de Padel - Iniciantes
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Clube Esportivo São Paulo
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-[#00ff88]/20 text-[#00ff88] rounded-full text-xs font-semibold">
                      Inscrito
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      15 de Mar, 2026
                    </span>
                    <span className="flex items-center gap-1">
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      32 atletas
                    </span>
                  </div>
                </div>

                <div className="bg-[#0a0e27]/50 rounded-lg p-4 border border-white/5 hover:border-[#00ff88]/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white mb-1">
                        Campeonato Regional - Duplas
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Arena Padel Center
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                      Disponível
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      22 de Mar, 2026
                    </span>
                    <span className="flex items-center gap-1">
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      16 atletas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-black text-white mb-6">
                Atividade Recente
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#00ff88]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-[#00ff88]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      Você se inscreveu no{" "}
                      <span className="font-semibold">
                        Torneio de Padel - Iniciantes
                      </span>
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Há 2 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-purple-400"
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
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-semibold">Maria Silva</span> enviou
                      solicitação de amizade
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Ontem</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-amber-400"
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
                  <div className="flex-1">
                    <p className="text-white">
                      Você conquistou a medalha{" "}
                      <span className="font-semibold">Primeiro Torneio</span>
                    </p>
                    <p className="text-gray-400 text-sm mt-1">2 dias atrás</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sala de Troféus */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-[#00ff88]"
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
                <h3 className="text-lg font-black text-white">
                  Sala de Troféus
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">Nenhum troféu ainda</p>
              <p className="text-gray-500 text-xs">
                Participe de torneios e acumule vitórias para ganhar troféus!
              </p>
            </div>

            {/* Atividade de Jogos */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-4">
                Atividade de Jogos
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Semana</span>
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Mês</span>
                  <span className="text-white font-bold">12</span>
                </div>
              </div>

              {/* Mini Calendar Heatmap */}
              <div className="space-y-2">
                <p className="text-gray-500 text-xs mb-3">Últimos 7 dias</p>
                <div className="grid grid-cols-7 gap-2">
                  <div className="aspect-square bg-[#0a0e27] rounded"></div>
                  <div className="aspect-square bg-[#00ff88]/20 rounded"></div>
                  <div className="aspect-square bg-[#00ff88]/40 rounded"></div>
                  <div className="aspect-square bg-[#0a0e27] rounded"></div>
                  <div className="aspect-square bg-[#00ff88]/60 rounded"></div>
                  <div className="aspect-square bg-[#00ff88]/40 rounded"></div>
                  <div className="aspect-square bg-[#00ff88]/80 rounded"></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>D</span>
                  <span>S</span>
                  <span>T</span>
                  <span>Q</span>
                  <span>Q</span>
                  <span>S</span>
                  <span>S</span>
                </div>
              </div>
            </div>

            {/* Encontre Amigos */}
            <div className="bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-black text-white mb-4">
                Encontre Amigos/Atletas
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Conecte-se com outros jogadores e expanda sua rede no esporte.
              </p>
              <button className="w-full py-2 px-4 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 rounded-lg font-semibold transition-colors text-sm">
                Encontre aqui
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthleteDashboard;
