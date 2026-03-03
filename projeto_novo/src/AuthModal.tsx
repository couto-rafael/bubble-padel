import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalView = "login" | "register" | "select-type";
type UserType = "athlete" | "club" | null;

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ModalView>("login");
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    cnpj: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentView("login");
    setUserType(null);
    setFormData({ email: "", password: "", confirmPassword: "", cnpj: "" });
    setErrors({});
    setShowPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format CNPJ as user types
    if (name === "cnpj") {
      const formatted = formatCNPJ(value);
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5)
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    if (userType === "club") {
      const cnpjNumbers = formData.cnpj.replace(/\D/g, "");
      if (!formData.cnpj) {
        newErrors.cnpj = "CNPJ é obrigatório";
      } else if (cnpjNumbers.length !== 14) {
        newErrors.cnpj = "CNPJ inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateLogin()) {
      // TODO: const { login } = useAuth(); await login(formData.email, formData.password);
      console.log("Login:", formData);
      // Simulação: verificar se é atleta ou clube (em produção, isso viria da API)
      // Por enquanto, vamos redirecionar para dashboard de atleta
      handleClose();
      navigate("/athlete/dashboard");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRegister()) {
      // TODO: const { register } = useAuth(); await register({ ...formData, userType });
      console.log("Register:", { ...formData, userType });
      handleClose();

      // Redirecionar baseado no tipo de usuário
      if (userType === "club") {
        navigate("/dashboard");
      } else if (userType === "athlete") {
        navigate("/athlete/dashboard");
      }
    }
  };

  const handleSelectUserType = (type: UserType) => {
    // Provisório: Redirecionar direto para o dashboard
    handleClose();

    if (type === "athlete") {
      navigate("/athlete/dashboard");
    } else if (type === "club") {
      navigate("/dashboard");
    }

    // Código original (comentado para teste)
    // setUserType(type);
    // setCurrentView("register");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-[#1a1f4a] to-[#0f1540] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-8">
          {/* Login View */}
          {currentView === "login" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#0a0e27]"
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
                <h2 className="text-3xl font-black mb-2">Entrar no Bubble</h2>
                <p className="text-gray-400">Acesse sua conta para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-[#0a0e27] border ${errors.email ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold mb-2"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 pr-12 py-3 bg-[#0a0e27] border ${errors.password ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors"
                      aria-label={
                        showPassword ? "Esconder senha" : "Mostrar senha"
                      }
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {showPassword ? (
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
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/10 bg-[#0a0e27] text-[#00ff88] focus:ring-[#00ff88]/50"
                    />
                    <span className="text-gray-400">Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    className="text-[#00ff88] hover:text-[#00dd77] transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e27] rounded-lg font-bold transition-all hover:scale-[1.02] shadow-lg"
                >
                  Entrar
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Não tem uma conta?{" "}
                  <button
                    onClick={() => setCurrentView("select-type")}
                    className="text-[#00ff88] hover:text-[#00dd77] font-semibold transition-colors"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Select Type View */}
          {currentView === "select-type" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#0a0e27]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-black mb-2">
                  Como você quer se cadastrar?
                </h2>
                <p className="text-gray-400">
                  Escolha o tipo de conta que melhor se adequa a você
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleSelectUserType("athlete")}
                  className="w-full p-6 bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 hover:from-[#1a1f4a] hover:to-[#0f1540] border border-white/10 hover:border-[#00ff88]/50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#00ff88]/20 to-[#00cc6a]/20 rounded-lg flex items-center justify-center group-hover:from-[#00ff88]/30 group-hover:to-[#00cc6a]/30 transition-colors">
                      <svg
                        className="w-7 h-7 text-[#00ff88]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold mb-1">Sou Atleta</h3>
                      <p className="text-gray-400 text-sm">
                        Encontre torneios e acompanhe seu desempenho
                      </p>
                    </div>
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-[#00ff88] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectUserType("club")}
                  className="w-full p-6 bg-gradient-to-br from-[#1a1f4a]/50 to-[#0f1540]/50 hover:from-[#1a1f4a] hover:to-[#0f1540] border border-white/10 hover:border-[#00ff88]/50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#00ff88]/20 to-[#00cc6a]/20 rounded-lg flex items-center justify-center group-hover:from-[#00ff88]/30 group-hover:to-[#00cc6a]/30 transition-colors">
                      <svg
                        className="w-7 h-7 text-[#00ff88]"
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
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold mb-1">Sou Clube</h3>
                      <p className="text-gray-400 text-sm">
                        Organize torneios e gerencie competições
                      </p>
                    </div>
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-[#00ff88] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setCurrentView("login")}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ← Voltar para login
                </button>
              </div>
            </div>
          )}

          {/* Register View */}
          {currentView === "register" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#0a0e27]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {userType === "athlete" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    )}
                  </svg>
                </div>
                <h2 className="text-3xl font-black mb-2">
                  Criar Conta{" "}
                  {userType === "athlete" ? "de Atleta" : "de Clube"}
                </h2>
                <p className="text-gray-400">Preencha os dados abaixo</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {userType === "club" && (
                  <div>
                    <label
                      htmlFor="cnpj"
                      className="block text-sm font-semibold mb-2"
                    >
                      CNPJ
                    </label>
                    <input
                      type="text"
                      id="cnpj"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      maxLength={18}
                      className={`w-full px-4 py-3 bg-[#0a0e27] border ${errors.cnpj ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`}
                      placeholder="00.000.000/0000-00"
                    />
                    {errors.cnpj && (
                      <p className="text-red-400 text-sm mt-1">{errors.cnpj}</p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email-register"
                    className="block text-sm font-semibold mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email-register"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-[#0a0e27] border ${errors.email ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password-register"
                    className="block text-sm font-semibold mb-2"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      id="password-register"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 pr-12 py-3 bg-[#0a0e27] border ${errors.password ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterPassword(!showRegisterPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors"
                      aria-label={
                        showRegisterPassword
                          ? "Esconder senha"
                          : "Mostrar senha"
                      }
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {showRegisterPassword ? (
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
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold mb-2"
                  >
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 pr-12 py-3 bg-[#0a0e27] border ${errors.confirmPassword ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`}
                      placeholder="Repita sua senha"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors"
                      aria-label={
                        showConfirmPassword ? "Esconder senha" : "Mostrar senha"
                      }
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {showConfirmPassword ? (
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
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00cc66] text-[#0a0e27] rounded-lg font-bold transition-all hover:scale-[1.02] shadow-lg"
                >
                  Criar Conta
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setCurrentView("select-type");
                    setUserType(null);
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                      cnpj: "",
                    });
                    setErrors({});
                  }}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
