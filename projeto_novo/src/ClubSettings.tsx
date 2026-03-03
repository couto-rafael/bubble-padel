import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";

// ─── mock ─────────────────────────────────────────────────
const CLUB = {
  name: "",
  cnpj: "",
  email: "",
  phone: "",
  slogan: "",
  description: "",
  logoUrl: null as string | null,
};

const ACCOUNT = {
  email: "contato@clube.com",
  clubName: "Clube Exemplo",
  memberSince: "01 de Janeiro de 2024",
};

// ─── sidebar items ────────────────────────────────────────
const SIDEBAR = [
  {
    key: "perfil",
    label: "Perfil",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    key: "estrutura",
    label: "Estrutura",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zM14 13a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z",
  },
  {
    key: "financeiro",
    label: "Financeiro",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H9a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    key: "conta",
    label: "Conta",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    key: "notificacoes",
    label: "Notificações",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    key: "privacidade",
    label: "Privacidade",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
  {
    key: "permissoes",
    label: "Permissões",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
] as const;
type SidebarKey = (typeof SIDEBAR)[number]["key"];

// ─── input styles (shared) ────────────────────────────────
const INPUT_CLS =
  "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
const LABEL_CLS = "block text-sm font-medium text-gray-600 mb-2";

// ─── page ─────────────────────────────────────────────────
const ClubSettings = () => {
  const [activeTab, setActiveTab] = useState<SidebarKey>("perfil");
  const [form, setForm] = useState(CLUB);
  const [saved, setSaved] = useState(false);

  // ── state para outras abas
  const [quadras, setQuadras] = useState<string[]>([]);
  const [extras, setExtras] = useState({
    estacionamento: false,
    bar: false,
    restaurante: false,
    vestiarios: false,
    salaoFestas: false,
    churrasqueira: false,
  });
  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [pixKeys, setPixKeys] = useState<
    Array<{ id: string; tipo: string; chave: string }>
  >([]);
  const [contaForm, setContaForm] = useState({
    emailAtual: ACCOUNT.email,
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [showPassword, setShowPassword] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });

  // ── estados para Notificações
  const [notificacoes, setNotificacoes] = useState({
    porEmail: true,
    porWhatsapp: false,
    peloApp: true,
    novaDupla: true,
    categoriaCheia: true,
    pagamentoConfirmado: true,
    jogoReagendado: false,
    resultadoInserido: false,
  });

  // ── estados para Privacidade
  const [privacidade, setPrivacidade] = useState({
    perfilPublico: true,
    mostrarEstatisticas: true,
    mostrarConquistas: true,
    permitirMensagens: true,
    permitirDesafios: true,
    mostrarAtividade: false,
  });

  // ── estados para Permissões
  const [permissoes, setPermissoes] = useState({
    criarEditarTorneios: true,
    acessarDadosFinanceiros: false,
    gerenciarCategorias: true,
    fazerTransmissoes: false,
    editarRegras: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddQuadra = () => {
    setQuadras((prev) => [...prev, `Quadra ${prev.length + 1}`]);
  };

  const handleRemoveQuadra = (index: number) => {
    setQuadras((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtraToggle = (key: keyof typeof extras) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnderecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndereco((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddPixKey = () => {
    setPixKeys((prev) => [
      ...prev,
      { id: Date.now().toString(), tipo: "E-mail", chave: "" },
    ]);
  };

  const handleRemovePixKey = (id: string) => {
    setPixKeys((prev) => prev.filter((key) => key.id !== id));
  };

  const handlePixKeyChange = (
    id: string,
    field: "tipo" | "chave",
    value: string,
  ) => {
    setPixKeys((prev) =>
      prev.map((key) => (key.id === id ? { ...key, [field]: value } : key)),
    );
  };

  const handleContaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContaForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNotificacoesToggle = (key: keyof typeof notificacoes) => {
    setNotificacoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacidadeToggle = (key: keyof typeof privacidade) => {
    setPrivacidade((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePermissoesToggle = (key: keyof typeof permissoes) => {
    setPermissoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── placeholder tabs (não implementados ainda)
  const PlaceholderTab = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-gray-900 font-bold text-lg">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">
          Esta seção ainda está em desenvolvimento
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <DashboardHeader activePage="dashboard" />

      <main className="pt-20 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 py-4 sm:py-8">
          {/* ── NAVEGAÇÃO MOBILE (tabs horizontais) ── */}
          <div className="lg:hidden mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {SIDEBAR.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === item.key
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "bg-white text-gray-600 border border-gray-300 hover:text-gray-900 hover:border-gray-400"
                  }`}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* ── SIDEBAR DESKTOP ── */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-24">
                <nav className="py-2">
                  {SIDEBAR.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                        activeTab === item.key
                          ? "bg-blue-50 text-blue-600 border-l-[3px] border-blue-600"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-l-[3px] border-transparent"
                      }`}
                    >
                      <svg
                        className="w-4.5 h-4.5 flex-shrink-0"
                        style={{ width: "1.125rem", height: "1.125rem" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ── CENTRO: conteúdo ── */}
            <div className="flex-1 min-w-0">
              {/* ── PERFIL ── */}
              {activeTab === "perfil" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                    Perfil do Clube
                  </h2>

                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Logo upload */}
                    <div>
                      <label className={LABEL_CLS}>Logo do Clube</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M3 9a6 6 0 0112 0v.75a4.5 4.5 0 018.25 2.25c0 2.484-2.25 4.5-5.25 4.5H6.75a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75c-2.484 0-4.5-2.016-4.5-4.5 0-2.178 1.612-3.972 3.75-4.238V9z"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button className="self-start px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                            Carregar Logo
                          </button>
                          <p className="text-xs text-gray-500">
                            PNG ou JPG, máx 2MB. Recomendado 200×200px
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nome do Clube */}
                    <div>
                      <label className={LABEL_CLS}>Nome do Clube</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nome do seu clube"
                        className={INPUT_CLS}
                      />
                    </div>

                    {/* CNPJ */}
                    <div>
                      <label className={LABEL_CLS}>CNPJ</label>
                      <input
                        name="cnpj"
                        value={form.cnpj}
                        onChange={handleChange}
                        placeholder="00.000.000/0000-00"
                        className={INPUT_CLS}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className={LABEL_CLS}>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@clube.com"
                        className={INPUT_CLS}
                      />
                    </div>

                    {/* Contato */}
                    <div>
                      <label className={LABEL_CLS}>Contato</label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="(00) 0 0000-0000"
                        className={INPUT_CLS}
                      />
                    </div>

                    {/* Slogan */}
                    <div>
                      <label className={LABEL_CLS}>Slogan</label>
                      <input
                        name="slogan"
                        value={form.slogan}
                        onChange={handleChange}
                        placeholder="Slogan do seu clube"
                        className={INPUT_CLS}
                      />
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className={LABEL_CLS}>Descrição do Clube</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Descrição do clube"
                        className={`${INPUT_CLS} resize-none`}
                      />
                    </div>

                    {/* Salvar */}
                    <button
                      onClick={handleSave}
                      className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                        saved
                          ? "bg-emerald-50 border border-emerald-300 text-blue-600"
                          : "bg-blue-600 hover:bg-blue-700 text-gray-900 hover:shadow"
                      }`}
                    >
                      {saved ? "✓ Perfil salvo com sucesso!" : "Salvar Perfil"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "estrutura" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                    Estrutura
                  </h2>

                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Quadras */}
                    <div>
                      <label className={LABEL_CLS}>Quadras</label>
                      <button
                        onClick={handleAddQuadra}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors mb-3"
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
                        Adicionar Quadra
                      </button>

                      {quadras.length === 0 ? (
                        <div className="text-gray-500 text-sm italic">
                          Nenhuma quadra adicionada ainda
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {quadras.map((quadra, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3"
                            >
                              <span className="text-sm text-gray-900 flex-1">
                                {quadra}
                              </span>
                              <button
                                onClick={() => handleRemoveQuadra(idx)}
                                className="text-red-400 hover:text-red-300 transition-colors"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Extras */}
                    <div>
                      <label className={LABEL_CLS}>Extras</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            key: "estacionamento" as const,
                            label: "Estacionamento",
                          },
                          { key: "bar" as const, label: "Bar" },
                          { key: "restaurante" as const, label: "Restaurante" },
                          { key: "vestiarios" as const, label: "Vestiários" },
                          {
                            key: "salaoFestas" as const,
                            label: "Salão de Festas",
                          },
                          {
                            key: "churrasqueira" as const,
                            label: "Churrasqueira",
                          },
                        ].map(({ key, label }) => (
                          <label
                            key={key}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={extras[key]}
                              onChange={() => handleExtraToggle(key)}
                              className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-[#7c3aed] focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-600">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Endereço Completo */}
                    <div>
                      <label className={LABEL_CLS}>Endereço Completo</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <input
                          name="cep"
                          value={endereco.cep}
                          onChange={handleEnderecoChange}
                          placeholder="00000-000"
                          className={INPUT_CLS}
                        />
                        <input
                          name="rua"
                          value={endereco.rua}
                          onChange={handleEnderecoChange}
                          placeholder="Rua"
                          className={INPUT_CLS}
                        />
                        <input
                          name="numero"
                          value={endereco.numero}
                          onChange={handleEnderecoChange}
                          placeholder="Número"
                          className={INPUT_CLS}
                        />
                        <input
                          name="bairro"
                          value={endereco.bairro}
                          onChange={handleEnderecoChange}
                          placeholder="Bairro"
                          className={INPUT_CLS}
                        />
                        <input
                          name="cidade"
                          value={endereco.cidade}
                          onChange={handleEnderecoChange}
                          placeholder="Cidade"
                          className={INPUT_CLS}
                        />
                        <input
                          name="estado"
                          value={endereco.estado}
                          onChange={handleEnderecoChange}
                          placeholder="Estado"
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>

                    {/* Maps placeholder */}
                    <div>
                      <label className={LABEL_CLS}>Maps</label>
                      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-gray-500 text-sm">
                          Google Maps será implementado aqui
                        </p>
                      </div>
                    </div>

                    {/* Fotos placeholder */}
                    <div>
                      <label className={LABEL_CLS}>Fotos</label>
                      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-gray-500 text-sm">
                          Upload de fotos será implementado aqui
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      className="w-full py-3 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-gray-900 hover:shadow transition-all"
                    >
                      Salvar Estrutura
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "financeiro" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                    Financeiro
                  </h2>

                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Chaves PIX */}
                    <div>
                      <label className={LABEL_CLS}>Chaves PIX</label>
                      <button
                        onClick={handleAddPixKey}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors mb-3"
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
                        Adicionar Chave PIX
                      </button>

                      {pixKeys.length === 0 ? (
                        <div className="text-gray-500 text-sm italic">
                          Nenhuma chave PIX adicionada
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pixKeys.map((pix, idx) => (
                            <div
                              key={pix.id}
                              className="flex items-center gap-3"
                            >
                              <span className="text-gray-500 text-sm w-6">
                                {idx + 1}º
                              </span>
                              <select
                                value={pix.tipo}
                                onChange={(e) =>
                                  handlePixKeyChange(
                                    pix.id,
                                    "tipo",
                                    e.target.value,
                                  )
                                }
                                className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                              >
                                <option value="E-mail">E-mail</option>
                                <option value="Celular">Celular</option>
                                <option value="CNPJ">CNPJ</option>
                                <option value="Chave Aleatória">
                                  Chave Aleatória
                                </option>
                              </select>
                              <input
                                value={pix.chave}
                                onChange={(e) =>
                                  handlePixKeyChange(
                                    pix.id,
                                    "chave",
                                    e.target.value,
                                  )
                                }
                                placeholder="Digite a chave PIX"
                                className={`${INPUT_CLS} flex-1`}
                              />
                              <button
                                onClick={() => handleRemovePixKey(pix.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-2"
                              >
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dados Financeiros */}
                    <div>
                      <label className={LABEL_CLS}>Dados Financeiros</label>
                      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-gray-500 text-sm">
                          Área para dados financeiros como Valor Recebido em
                          Torneios será desenvolvida
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      className="w-full py-3 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-gray-900 hover:shadow transition-all"
                    >
                      Salvar Dados Financeiros
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "conta" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                    Conta
                  </h2>

                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Email Atual */}
                    <div>
                      <label className={LABEL_CLS}>Email Atual</label>
                      <div className="flex items-center gap-3">
                        <input
                          value={contaForm.emailAtual}
                          disabled
                          className={`${INPUT_CLS} flex-1 opacity-60 cursor-not-allowed`}
                        />
                        <button className="px-4 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                          Alterar Email
                        </button>
                      </div>
                    </div>

                    {/* Alterar Senha */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-base font-bold mb-4">
                        Alterar Senha
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className={LABEL_CLS}>Senha Atual</label>
                          <div className="relative">
                            <input
                              type={showPassword.atual ? "text" : "password"}
                              name="senhaAtual"
                              value={contaForm.senhaAtual}
                              onChange={handleContaChange}
                              className={INPUT_CLS}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((prev) => ({
                                  ...prev,
                                  atual: !prev.atual,
                                }))
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                {showPassword.atual ? (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                ) : (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                )}
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={LABEL_CLS}>Nova Senha</label>
                          <div className="relative">
                            <input
                              type={showPassword.nova ? "text" : "password"}
                              name="novaSenha"
                              value={contaForm.novaSenha}
                              onChange={handleContaChange}
                              className={INPUT_CLS}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((prev) => ({
                                  ...prev,
                                  nova: !prev.nova,
                                }))
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                {showPassword.nova ? (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                ) : (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                )}
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={LABEL_CLS}>
                            Confirmar Nova Senha
                          </label>
                          <div className="relative">
                            <input
                              type={
                                showPassword.confirmar ? "text" : "password"
                              }
                              name="confirmarSenha"
                              value={contaForm.confirmarSenha}
                              onChange={handleContaChange}
                              className={INPUT_CLS}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((prev) => ({
                                  ...prev,
                                  confirmar: !prev.confirmar,
                                }))
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                {showPassword.confirmar ? (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                ) : (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                )}
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      className="w-full py-3 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-gray-900 hover:shadow transition-all"
                    >
                      Alterar Senha
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "notificacoes" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                    Notificações
                  </h2>

                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Desejo receber notificações */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="font-bold text-base">
                          Desejo receber notificações:
                        </h3>
                      </div>

                      <div className="space-y-3 ml-7">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.porEmail}
                            onChange={() =>
                              handleNotificacoesToggle("porEmail")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Por e-mail
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.porWhatsapp}
                            onChange={() =>
                              handleNotificacoesToggle("porWhatsapp")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Por WhatsApp (futuro)
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.peloApp}
                            onChange={() => handleNotificacoesToggle("peloApp")}
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Pelo app
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Quero ser notificado quando */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          className="w-5 h-5 text-orange-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        <h3 className="font-bold text-base">
                          Quero ser notificado quando:
                        </h3>
                      </div>

                      <div className="space-y-3 ml-7">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.novaDupla}
                            onChange={() =>
                              handleNotificacoesToggle("novaDupla")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Uma nova dupla se inscrever
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.categoriaCheia}
                            onChange={() =>
                              handleNotificacoesToggle("categoriaCheia")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Uma categoria estiver cheia
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.pagamentoConfirmado}
                            onChange={() =>
                              handleNotificacoesToggle("pagamentoConfirmado")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Um pagamento for confirmado
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.jogoReagendado}
                            onChange={() =>
                              handleNotificacoesToggle("jogoReagendado")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Um jogo for reagendado
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes.resultadoInserido}
                            onChange={() =>
                              handleNotificacoesToggle("resultadoInserido")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Um resultado for inserido
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Alertas Automáticos (futuro) */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="font-bold text-base">
                          Alertas Automáticos (futuro)
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 ml-7">
                        Em breve você poderá programar alertas automáticos, como
                        "Enviar lembrete 1h antes do jogo".
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "privacidade" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                    Privacidade
                  </h2>

                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Visibilidade do Perfil */}
                    <div>
                      <h3 className="font-bold text-base mb-4">
                        Visibilidade do Perfil
                      </h3>

                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              Perfil público
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Seu perfil pode ser visto por qualquer pessoa
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handlePrivacidadeToggle("perfilPublico")
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              privacidade.perfilPublico
                                ? "bg-blue-600"
                                : "bg-gray-600"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                privacidade.perfilPublico
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              Mostrar estatísticas
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Suas estatísticas são visíveis para outros
                              jogadores
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handlePrivacidadeToggle("mostrarEstatisticas")
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              privacidade.mostrarEstatisticas
                                ? "bg-blue-600"
                                : "bg-gray-600"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                privacidade.mostrarEstatisticas
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              Mostrar conquistas
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Suas conquistas são visíveis para outros jogadores
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handlePrivacidadeToggle("mostrarConquistas")
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              privacidade.mostrarConquistas
                                ? "bg-blue-600"
                                : "bg-gray-600"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                privacidade.mostrarConquistas
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Interações */}
                    <div>
                      <h3 className="font-bold text-base mb-4">Interações</h3>

                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              Permitir mensagens
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Outros jogadores podem te enviar mensagens
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handlePrivacidadeToggle("permitirMensagens")
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              privacidade.permitirMensagens
                                ? "bg-blue-600"
                                : "bg-gray-600"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                privacidade.permitirMensagens
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              Permitir desafios
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Outros jogadores podem te desafiar para partidas
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handlePrivacidadeToggle("permitirDesafios")
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              privacidade.permitirDesafios
                                ? "bg-blue-600"
                                : "bg-gray-600"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                privacidade.permitirDesafios
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              Mostrar atividade
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Sua atividade recente é visível para outros
                              jogadores
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handlePrivacidadeToggle("mostrarAtividade")
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              privacidade.mostrarAtividade
                                ? "bg-blue-600"
                                : "bg-gray-600"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                privacidade.mostrarAtividade
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Deletar Conta */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="font-bold text-base mb-4">Conta</h3>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-white border border-red-900/30 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            Deletar conta
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Remover permanentemente sua conta e todos os dados
                          </p>
                        </div>
                        <button className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-semibold transition-colors">
                          Deletar Conta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "permissoes" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                    Permissões
                  </h2>

                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Permissões dos membros da conta */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="font-bold text-base">
                          Permissões dos membros da conta:
                        </h3>
                      </div>

                      <div className="space-y-3 ml-7">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissoes.criarEditarTorneios}
                            onChange={() =>
                              handlePermissoesToggle("criarEditarTorneios")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Pode criar ou editar torneios
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissoes.acessarDadosFinanceiros}
                            onChange={() =>
                              handlePermissoesToggle("acessarDadosFinanceiros")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Pode acessar dados financeiros
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissoes.gerenciarCategorias}
                            onChange={() =>
                              handlePermissoesToggle("gerenciarCategorias")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Pode gerenciar categorias
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissoes.fazerTransmissoes}
                            onChange={() =>
                              handlePermissoesToggle("fazerTransmissoes")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Pode fazer transmissões
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissoes.editarRegras}
                            onChange={() =>
                              handlePermissoesToggle("editarRegras")
                            }
                            className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-600">
                            Pode editar regras
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Perfis de Acesso */}
                    <div>
                      <h3 className="font-bold text-base mb-4">
                        Perfis de Acesso
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Administrador */}
                        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">👑</span>
                            </div>
                            <h4 className="font-bold text-base">
                              Administrador
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500">
                            Acesso total a todas as funcionalidades
                          </p>
                        </div>

                        {/* Gestor de Torneio */}
                        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">🏆</span>
                            </div>
                            <h4 className="font-bold text-base">
                              Gestor de Torneio
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500">
                            Pode criar e gerenciar torneios
                          </p>
                        </div>

                        {/* Financeiro */}
                        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">💰</span>
                            </div>
                            <h4 className="font-bold text-base">Financeiro</h4>
                          </div>
                          <p className="text-xs text-gray-500">
                            Acesso aos dados financeiros
                          </p>
                        </div>

                        {/* Operacional */}
                        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">⚙️</span>
                            </div>
                            <h4 className="font-bold text-base">Operacional</h4>
                          </div>
                          <p className="text-xs text-gray-500">
                            Gerencia jogos e resultados
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── DIREITA: resumo conta (apenas desktop) ── */}
            <aside className="hidden xl:block w-64 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 sticky top-24">
                <h3 className="font-bold text-base">Conta</h3>

                {/* Email */}
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {ACCOUNT.email}
                  </p>
                  <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors mt-1">
                    Alterar e-mail de acesso
                  </button>
                </div>

                {/* Nome */}
                <div>
                  <p className="text-xs text-gray-500">Nome do Clube</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {ACCOUNT.clubName}
                  </p>
                </div>

                {/* Membro desde */}
                <div>
                  <p className="text-xs text-gray-500">Membro desde</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {ACCOUNT.memberSince}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClubSettings;
