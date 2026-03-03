import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import MobileMenu from './MobileMenu';

const Contact = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você adicionaria a lógica para enviar o formulário
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#0a0e27]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight">Bubble</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Início</Link>
              <Link to="/tournaments" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Torneios</Link>
              <Link to="/contact" className="text-white font-medium text-sm">Contato</Link>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2.5 bg-[#00ff88] text-[#0a0e27] rounded-lg font-semibold text-sm hover:bg-[#00dd77] transition-all"
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
      <section className="relative pt-32 pb-16 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#0f1540] to-[#0a0e27]"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#00ff88] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#00ccff] rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">Entre em Contato</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Tem alguma dúvida ou precisa de ajuda? Nossa equipe está pronta para ajudar você a organizar torneios incríveis.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Cards */}
              <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 rounded-lg flex items-center justify-center mb-4 text-[#00ff88]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Email</h3>
                <a href="mailto:contato@bubble.com.br" className="text-gray-400 hover:text-[#00ff88] transition-colors">
                  contato@bubble.com.br
                </a>
                <p className="text-gray-500 text-sm mt-2">Respondemos em até 24 horas</p>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 rounded-lg flex items-center justify-center mb-4 text-[#00ff88]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Telefone</h3>
                <a href="tel:+551140405050" className="text-gray-400 hover:text-[#00ff88] transition-colors">
                  (11) 4040-5050
                </a>
                <p className="text-gray-500 text-sm mt-2">Seg - Sex, 9h às 18h</p>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 rounded-lg flex items-center justify-center mb-4 text-[#00ff88]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Endereço</h3>
                <p className="text-gray-400">
                  Avenida Paulista, 1000<br />
                  Bela Vista, São Paulo - SP<br />
                  CEP: 01310-100
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/20 rounded-lg flex items-center justify-center mb-4 text-[#00ff88]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">WhatsApp</h3>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00ff88] transition-colors">
                  (11) 99999-9999
                </a>
                <p className="text-gray-500 text-sm mt-2">Atendimento rápido via WhatsApp</p>
              </div>

              {/* Social Media */}
              <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold mb-4">Redes Sociais</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 bg-white/5 hover:bg-[#00ff88]/20 rounded-lg flex items-center justify-center transition-all hover:scale-110">
                    <svg className="w-5 h-5 text-gray-400 hover:text-[#00ff88]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/5 hover:bg-[#00ff88]/20 rounded-lg flex items-center justify-center transition-all hover:scale-110">
                    <svg className="w-5 h-5 text-gray-400 hover:text-[#00ff88]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/5 hover:bg-[#00ff88]/20 rounded-lg flex items-center justify-center transition-all hover:scale-110">
                    <svg className="w-5 h-5 text-gray-400 hover:text-[#00ff88]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/5 hover:bg-[#00ff88]/20 rounded-lg flex items-center justify-center transition-all hover:scale-110">
                    <svg className="w-5 h-5 text-gray-400 hover:text-[#00ff88]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-8 rounded-xl border border-white/10">
                <h2 className="text-3xl font-bold mb-6">Envie sua Mensagem</h2>
                
                {formSubmitted ? (
                  <div className="bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-[#00ff88] rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#0a0e27]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#00ff88]">Mensagem Enviada!</h3>
                    <p className="text-gray-300">Obrigado pelo contato. Responderemos em breve.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-[#0a0e27] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors"
                          placeholder="Seu nome"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-[#0a0e27] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-[#0a0e27] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors"
                          placeholder="(11) 99999-9999"
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-semibold mb-2">
                          Assunto *
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-[#0a0e27] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Selecione um assunto</option>
                          <option value="duvidas">Dúvidas sobre o produto</option>
                          <option value="suporte">Suporte técnico</option>
                          <option value="vendas">Comercial / Vendas</option>
                          <option value="parceria">Proposta de parceria</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold mb-2">
                        Mensagem *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 bg-[#0a0e27] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors resize-none"
                        placeholder="Escreva sua mensagem aqui..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e27] rounded-lg font-bold text-lg transition-all hover:scale-[1.02] shadow-lg hover:shadow-[0_0_30px_rgba(0,255,136,0.4)]"
                    >
                      Enviar Mensagem
                    </button>

                    <p className="text-sm text-gray-500 mt-4">
                      * Campos obrigatórios
                    </p>
                  </form>
                )}
              </div>

              {/* FAQ Quick Links */}
              <div className="mt-8 bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 p-6 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold mb-4">Perguntas Frequentes</h3>
                <div className="space-y-3">
                  <a href="#" className="block text-gray-400 hover:text-[#00ff88] transition-colors text-sm">
                    → Como criar meu primeiro torneio?
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-[#00ff88] transition-colors text-sm">
                    → Quais formas de pagamento são aceitas?
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-[#00ff88] transition-colors text-sm">
                    → Como funciona o período de teste gratuito?
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-[#00ff88] transition-colors text-sm">
                    → Posso cancelar meu plano a qualquer momento?
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050817] border-t border-white/5 py-12 px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#0a0e27]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">Bubble</span>
              </div>
              <p className="text-gray-500 text-sm">
                A plataforma moderna para gestão de torneios de padel.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Recursos</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><Link to="/tournaments" className="hover:text-white transition-colors">Torneios</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contato</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 Bubble. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
