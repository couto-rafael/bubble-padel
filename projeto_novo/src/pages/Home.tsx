import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import MobileMenu from "../components/MobileMenu";
import Footer from "../components/Footer";

const Home = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white font-sans antialiased">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#0a0e27]"
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
              <span className="text-2xl font-bold tracking-tight">Bubble</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Recursos
              </a>
              <Link
                to="/tournaments"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Torneios
              </Link>
              <a
                href="#pricing"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Preços
              </a>
              <Link
                to="/contact"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Contato
              </Link>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2.5 bg-[#00ff88] text-[#0a0e27] rounded-lg font-semibold text-sm hover:bg-[#00dd77] transition-all hover:scale-105"
              >
                Entrar
              </button>
            </div>

            {/* Mobile Menu */}
            <MobileMenu onLoginClick={() => setIsAuthModalOpen(true)} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#0f1540] to-[#0a0e27]"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#00ff88] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#00ccff] rounded-full blur-[120px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300">
                Mais de 500 clubes de padel confiam na gente
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.1]">
              Organize Torneios de Padel
              <span className="block bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent mt-2">
                Sem Complicação
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Chega de planilhas e grupos de WhatsApp. Bubble é a plataforma
              completa para criar, gerenciar e realizar torneios profissionais
              de padel sem estresse.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group px-8 py-4 bg-[#00ff88] text-[#0a0e27] rounded-xl font-bold text-lg hover:bg-[#00dd77] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] flex items-center gap-2">
                Criar Seu Primeiro Torneio
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              <button className="px-8 py-4 border-2 border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/5 transition-all hover:border-white/40">
                Ver Como Funciona
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-[#0a0e27] to-[#0f1540]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4">
              Como Funciona
            </h2>
            <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto">
              Três passos simples para realizar torneios profissionais
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                step: "01",
                title: "Crie o Torneio",
                description:
                  "Configure seu torneio em minutos. Defina formato, grupos, datas e regras de inscrição com nosso criador intuitivo.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Jogadores se Inscrevem",
                description:
                  "Compartilhe o link do torneio. Jogadores se inscrevem e pagam online. Acompanhe as inscrições em tempo real com confirmações automáticas.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Realize e Acompanhe",
                description:
                  "Gere partidas automaticamente. Atualize placares em tempo real. Jogadores e espectadores acompanham classificações e chaves ao vivo.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
              },
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/10 to-[#00ccff]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] p-5 md:p-8 rounded-2xl border border-white/10 hover:border-[#00ff88]/30 transition-all">
                  {/* Mobile: horizontal layout — número + ícone na mesma linha */}
                  <div className="flex items-center gap-4 mb-3 md:block">
                    <div className="text-[#00ff88]/40 text-3xl md:text-6xl font-black md:mb-4 leading-none">
                      {item.step}
                    </div>
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-xl flex items-center justify-center md:mb-6 text-[#0a0e27] flex-shrink-0">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-12 md:py-20 px-4 md:px-6 lg:px-8 bg-[#0a0e27]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4">
              Feito Para o Padel Moderno
            </h2>
            <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto">
              Tudo que você precisa para realizar torneios de classe mundial
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                title: "Criação de Torneios",
                description:
                  "Formatos disponíveis: Super 8, Mata-mata, Grupo + Mata-mata. Configure tudo em um só lugar.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                ),
              },
              {
                title: "Organização Inteligente",
                description:
                  "Agendamento automático de partidas, alocação de quadras e geração de chaves. Zero trabalho manual.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                ),
              },
              {
                title: "Resultados em Tempo Real",
                description:
                  "Atualizações de placar ao vivo, classificações instantâneas e notificações automáticas para todos os participantes.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ),
              },
              {
                title: "Experiência Mobile-First",
                description:
                  "Perfeito em qualquer dispositivo. Jogadores gerenciam tudo pelo celular durante os torneios.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                ),
              },
              {
                title: "Feito Para Clubes",
                description:
                  "Gerenciamento de múltiplos torneios, banco de dados de membros e templates de eventos recorrentes para clubes.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                ),
              },
              {
                title: "Feito Para Atletas",
                description:
                  "Perfis de jogadores, estatísticas de desempenho, sistemas de ranking e histórico de torneios.",
                icon: (
                  <svg
                    className="w-6 h-6"
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
                ),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-4 md:p-6 rounded-xl border border-white/5 hover:border-[#00ff88]/30 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-2 md:block">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 rounded-lg flex items-center justify-center md:mb-4 text-[#00ff88] group-hover:scale-110 transition-transform flex-shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-base md:text-xl font-bold md:mb-2">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-12 md:py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-[#0a0e27] to-[#0f1540]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4">
              Para Quem é o Bubble?
            </h2>
            <p className="text-base md:text-xl text-gray-400">
              Feito para todos no ecossistema do padel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/10 to-transparent rounded-2xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] p-5 md:p-10 rounded-2xl border border-white/10 hover:border-[#00ff88]/30 transition-all">
                <div className="flex items-center gap-4 mb-4 md:block">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-2xl flex items-center justify-center md:mb-6 flex-shrink-0">
                    <svg
                      className="w-6 h-6 md:w-8 md:h-8 text-[#0a0e27]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl md:text-3xl font-bold md:mb-4">
                    Clubes & Organizadores
                  </h3>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Realize torneios profissionais sem pesadelo administrativo.
                  Economize horas de organização, elimine o caos das inscrições
                  e ofereça uma experiência premium que faz os jogadores
                  voltarem.
                </p>
                <ul className="space-y-3">
                  {[
                    "Automatize inscrições e pagamentos",
                    "Gere chaves instantaneamente",
                    "Gerencie múltiplos torneios",
                    "Acompanhe participação de membros",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-gray-300"
                    >
                      <div className="w-5 h-5 bg-[#00ff88]/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-[#00ff88]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ccff]/10 to-transparent rounded-2xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] p-5 md:p-10 rounded-2xl border border-white/10 hover:border-[#00ccff]/30 transition-all">
                <div className="flex items-center gap-4 mb-4 md:block">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#00ccff] to-[#0099cc] rounded-2xl flex items-center justify-center md:mb-6 flex-shrink-0">
                    <svg
                      className="w-6 h-6 md:w-8 md:h-8 text-[#0a0e27]"
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
                  <h3 className="text-xl md:text-3xl font-bold md:mb-4">
                    Jogadores & Atletas
                  </h3>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Foque no seu jogo, não na logística. Inscreva-se em torneios
                  em segundos, acompanhe suas partidas ao vivo e construa seu
                  perfil competitivo. Tudo que você precisa no bolso.
                </p>
                <ul className="space-y-3">
                  {[
                    "Inscrição em torneios com um clique",
                    "Placares e classificações ao vivo",
                    "Acompanhamento de desempenho",
                    "Histórico e rankings de torneios",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-gray-300"
                    >
                      <div className="w-5 h-5 bg-[#00ccff]/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-[#00ccff]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 md:py-20 px-4 md:px-6 lg:px-8 bg-[#0a0e27]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4">
              Feito Para Clubes de Padel Modernos
            </h2>
            <p className="text-base md:text-xl text-gray-400">
              Confiável pelos principais clubes do Brasil
            </p>
          </div>

          {/* Logo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-16">
            {["Padel Pro", "Court Masters", "Racket Club", "Ace Courts"].map(
              (name, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-[#1a1f4a]/30 to-[#0f1540]/30 p-4 md:p-8 rounded-xl border border-white/5 flex items-center justify-center"
                >
                  <div className="text-gray-500 font-bold text-lg">{name}</div>
                </div>
              ),
            )}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                quote:
                  "O Bubble transformou como organizamos torneios. O que levava dias agora leva minutos. Nossos membros adoram a experiência profissional.",
                author: "Carlos Rodrigues",
                role: "Diretor de Torneios, Madrid Padel Club",
              },
              {
                quote:
                  "As atualizações em tempo real e o agendamento automatizado economizaram incontáveis horas. Os jogadores finalmente podem focar em jogar ao invés de perguntar sobre horários das partidas.",
                author: "Sofia Martinez",
                role: "Gerente de Clube, Barcelona Courts",
              },
              {
                quote:
                  "Dobramos nossa frequência de torneios desde que mudamos para o Bubble. A plataforma cuida de tudo perfeitamente, da inscrição aos resultados finais.",
                author: "Miguel Santos",
                role: "Organizador, Lisbon Padel League",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-8 rounded-xl border border-white/10"
              >
                <div className="text-[#00ff88] mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {testimonial.quote}
                </p>
                <div>
                  <div className="font-bold">{testimonial.author}</div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-12 md:py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-[#0a0e27] to-[#0f1540]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4">
              Grátis Durante o Lançamento
            </h2>
            <p className="text-base md:text-xl text-gray-400">
              Organize quantos torneios quiser, agora sem custo. Você paga
              apenas a taxa do gateway quando seus atletas fazem inscrições
              pagas.
            </p>
          </div>

          {/* Main Free Card */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] p-6 md:p-12 lg:p-16 rounded-3xl border-2 border-[#00ff88]/50 shadow-[0_0_60px_rgba(0,255,136,0.3)]">
                <div className="text-center">
                  {/* Big ZERO */}
                  <div className="mb-6 md:mb-8">
                    <div className="text-[80px] md:text-[140px] lg:text-[180px] font-black leading-[0.9] bg-gradient-to-r from-[#00ff88] via-[#00ffaa] to-[#00ccff] bg-clip-text text-transparent tracking-tighter">
                      0
                    </div>
                    <div className="text-xl md:text-3xl font-bold text-gray-300 mt-2 md:-mt-6">
                      AGORA
                    </div>
                  </div>

                  <div className="max-w-2xl mx-auto mb-8">
                    <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
                      Crie{" "}
                      <span className="text-[#00ff88] font-bold">
                        torneios ilimitados
                      </span>
                      , gerencie{" "}
                      <span className="text-[#00ff88] font-bold">
                        grupos e playoffs
                      </span>{" "}
                      e receba inscrições com PIX direto na sua conta.
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      * Grátis para os primeiros clubes do lançamento. A Bubble
                      não cobra comissão — você paga apenas a taxa do gateway
                      (~1%) quando seus atletas fazem inscrições pagas. O PIX
                      vai direto para sua conta.
                    </p>
                  </div>

                  <button className="px-12 py-5 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e27] rounded-xl font-black text-xl transition-all hover:scale-105 shadow-lg hover:shadow-[0_0_40px_rgba(0,255,136,0.5)]">
                    Começar Gratuitamente
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">
              O Que Você Ganha de Graça
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  title: "Torneios Ilimitados",
                  description: "Crie quantos torneios quiser, quando quiser",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  ),
                  title: "Jogadores Ilimitados",
                  description: "Sem limite de participantes nos seus torneios",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  ),
                  title: "Resultados em Tempo Real",
                  description:
                    "Atualizações instantâneas de placares e classificações",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                  title: "App Mobile Completo",
                  description: "Experiência perfeita em qualquer dispositivo",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  ),
                  title: "Gestão Automática",
                  description:
                    "Chaves, agendamento e organização automatizados",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ),
                  title: "Suporte Dedicado",
                  description: "Ajuda quando você precisar, sem custo extra",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-4 md:p-6 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-2 md:block">
                    <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 rounded-lg flex items-center justify-center md:mb-4 text-[#00ff88] flex-shrink-0">
                      {feature.icon}
                    </div>
                    <h4 className="text-base md:text-lg font-bold md:mb-2">
                      {feature.title}
                    </h4>
                  </div>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ About Pricing */}
          <div className="max-w-3xl mx-auto mt-16">
            <div className="bg-gradient-to-br from-[#1a1f4a]/30 to-[#0f1540]/30 p-8 rounded-xl border border-white/10">
              <h3 className="text-xl font-bold mb-6 text-center">
                Perguntas Sobre Preços
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#00ff88] mb-2">
                    💰 É realmente grátis mesmo?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Sim! Você não paga nada para usar o Bubble. Crie quantos
                    torneios quiser, adicione quantos jogadores precisar. Tudo
                    sem custo.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#00ff88] mb-2">
                    💳 E as taxas de pagamento?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Se você cobrar inscrição dos jogadores, haverá a taxa padrão
                    do gateway de pagamento (Mercado Pago, PagSeguro, etc). Essa
                    taxa não é do Bubble, é do parceiro de pagamento.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#00ff88] mb-2">
                    🔒 Tem pegadinha? Vou pagar depois?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Nenhuma pegadinha. O Bubble é 100% gratuito para você
                    organizar torneios. Não tem mensalidade escondida, não tem
                    período de teste que vira pago. É grátis mesmo.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#00ff88] mb-2">
                    📊 Existe versão paga com mais recursos?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Não! Todos os recursos estão disponíveis gratuitamente.
                    Nossa missão é democratizar a organização de torneios de
                    padel no Brasil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20 px-4 md:px-6 lg:px-8 bg-[#0a0e27] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 to-[#00ccff]/5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,100vw)] h-[min(800px,100vw)] bg-[#00ff88] rounded-full blur-[150px] opacity-10"></div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Comece a Organizar Torneios
            <span className="block bg-gradient-to-r from-[#00ff88] to-[#00ccff] bg-clip-text text-transparent mt-2">
              Melhores Hoje Mesmo
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de clubes e organizadores que já mudaram para o
            Bubble. Seu primeiro torneio está a apenas alguns minutos de
            distância.
          </p>
          <button className="group px-10 py-5 bg-[#00ff88] text-[#0a0e27] rounded-xl font-bold text-xl hover:bg-[#00dd77] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(0,255,136,0.5)] flex items-center gap-3 mx-auto">
            Criar Seu Torneio Agora
            <svg
              className="w-6 h-6 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
          <p className="text-sm text-gray-500 mt-6">
            Não precisa de cartão de crédito • Grátis no lançamento
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
