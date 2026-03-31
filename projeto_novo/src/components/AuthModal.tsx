import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
}

type ModalView = "login" | "select-type" | "register-athlete" | "register-club";

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {open ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    ) : (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </>
    )}
  </svg>
);

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 pr-12 py-3 bg-[#0a0e27] border ${error ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
};

const inputClass = (err?: string) =>
  `w-full px-4 py-3 bg-[#0a0e27] border ${err ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50 transition-colors`;

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  returnUrl,
}) => {
  const navigate = useNavigate();
  const [view, setView] = useState<ModalView>("login");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Atleta
  const [athleteData, setAthleteData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [athleteAcceptedTerms, setAthleteAcceptedTerms] = useState(false);

  // Clube
  const [clubData, setClubData] = useState({
    clubName: "",
    cnpj: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [clubAcceptedTerms, setClubAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setView("login");
    setErrors({});
    setApiError("");
    setLoading(false);
    setLoginData({ email: "", password: "" });
    setAthleteData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setClubData({
      clubName: "",
      cnpj: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const formatCNPJ = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 14);
    if (n.length <= 2) return n;
    if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
    if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
    if (n.length <= 12)
      return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
  };

  // ── LOGIN ───────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!loginData.email) errs.email = "Email obrigatório";
    if (!loginData.password) errs.password = "Senha obrigatória";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      const { user } = await AuthService.login(
        loginData.email,
        loginData.password,
      );
      // navigate antes do handleClose para evitar race condition de desmonte
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate(user.type === "CLUB" ? "/dashboard" : "/athlete/dashboard");
      }
      handleClose();
    } catch (err: any) {
      setApiError(err.message ?? "Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ATHLETE ────────────────────────────────────────────────────────

  const handleRegisterAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!athleteData.firstName.trim()) errs.firstName = "Nome obrigatório";
    if (!athleteData.lastName.trim()) errs.lastName = "Sobrenome obrigatório";
    if (!athleteData.email) errs.email = "Email obrigatório";
    else if (!/\S+@\S+\.\S+/.test(athleteData.email))
      errs.email = "Email inválido";
    if (!athleteData.password) errs.password = "Senha obrigatória";
    else if (athleteData.password.length < 6)
      errs.password = "Mínimo 6 caracteres";
    if (athleteData.password !== athleteData.confirmPassword)
      errs.confirmPassword = "Senhas não coincidem";
    if (!athleteAcceptedTerms) errs.terms = "Aceite os termos para continuar";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      await AuthService.register({
        name: `${athleteData.firstName.trim()} ${athleteData.lastName.trim()}`,
        email: athleteData.email,
        password: athleteData.password,
        type: "ATHLETE",
      });
      handleClose();
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate("/athlete/dashboard");
      }
    } catch (err: any) {
      setApiError(err.message ?? "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER CLUB ───────────────────────────────────────────────────────────

  const handleRegisterClub = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!clubData.clubName.trim()) errs.clubName = "Nome do clube obrigatório";
    const cnpjNum = clubData.cnpj.replace(/\D/g, "");
    if (!cnpjNum) errs.cnpj = "CNPJ obrigatório";
    else if (cnpjNum.length !== 14) errs.cnpj = "CNPJ inválido";
    if (!clubData.email) errs.email = "Email obrigatório";
    else if (!/\S+@\S+\.\S+/.test(clubData.email))
      errs.email = "Email inválido";
    if (!clubData.password) errs.password = "Senha obrigatória";
    else if (clubData.password.length < 6)
      errs.password = "Mínimo 6 caracteres";
    if (clubData.password !== clubData.confirmPassword)
      errs.confirmPassword = "Senhas não coincidem";
    if (!clubAcceptedTerms) errs.terms = "Aceite os termos para continuar";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      await AuthService.register({
        name: clubData.clubName.trim(),
        email: clubData.email,
        password: clubData.password,
        type: "CLUB",
        cnpj: clubData.cnpj,
      });
      handleClose();
      // ← Redireciona para configurações com flag de boas-vindas
      navigate("/dashboard/settings?welcome=true");
    } catch (err: any) {
      setApiError(err.message ?? "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  // ── UI HELPERS ──────────────────────────────────────────────────────────────

  const Logo = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
        <svg
          className="w-5 h-5 text-[#0a0e27]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="text-xl font-black text-white">BubblePadel</span>
    </div>
  );

  const SubmitBtn = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#0a0e27] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? "Carregando..." : label}
    </button>
  );

  const BackBtn = ({
    to,
    label = "← Voltar",
  }: {
    to: ModalView;
    label?: string;
  }) => (
    <button
      onClick={() => {
        setView(to);
        setErrors({});
        setApiError("");
      }}
      className="w-full mt-4 text-gray-400 hover:text-white text-sm transition-colors"
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md bg-[#0f1540] border border-white/10 rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
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

        {/* ── LOGIN ── */}
        {view === "login" && (
          <div>
            <div className="text-center mb-8">
              <Logo />
              <h2 className="text-3xl font-black mb-2 text-white">Entrar</h2>
              <p className="text-gray-400">Acesse sua conta</p>
            </div>
            {apiError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {apiError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Email
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  placeholder="seu@email.com"
                  onChange={(e) => {
                    setLoginData((d) => ({ ...d, email: e.target.value }));
                    setErrors((v) => ({ ...v, email: "" }));
                  }}
                  className={inputClass(errors.email)}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Senha
                </label>
                <PasswordInput
                  id="login-pw"
                  name="password"
                  value={loginData.password}
                  placeholder="Sua senha"
                  onChange={(e) => {
                    setLoginData((d) => ({ ...d, password: e.target.value }));
                    setErrors((v) => ({ ...v, password: "" }));
                  }}
                  error={errors.password}
                />
              </div>
              <SubmitBtn label="Entrar" />
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Não tem conta?{" "}
                <button
                  onClick={() => setView("select-type")}
                  className="text-[#00ff88] hover:underline font-semibold"
                >
                  Criar conta
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── SELECIONAR TIPO ── */}
        {view === "select-type" && (
          <div>
            <div className="text-center mb-8">
              <Logo />
              <h2 className="text-3xl font-black mb-2 text-white">
                Criar Conta
              </h2>
              <p className="text-gray-400">Escolha o tipo de conta</p>
            </div>
            <div className="space-y-4">
              {[
                {
                  type: "register-athlete" as ModalView,
                  title: "Atleta",
                  desc: "Participe de torneios e acompanhe seus resultados",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  ),
                },
                {
                  type: "register-club" as ModalView,
                  title: "Clube",
                  desc: "Organize torneios e gerencie suas quadras",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  ),
                },
              ].map(({ type, title, desc, icon }) => (
                <button
                  key={type}
                  onClick={() => setView(type)}
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
                        {icon}
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold mb-1 text-white">
                        {title}
                      </h3>
                      <p className="text-gray-400 text-sm">{desc}</p>
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
              ))}
            </div>
            <BackBtn to="login" label="← Voltar para login" />
          </div>
        )}

        {/* ── CADASTRO ATLETA ── */}
        {view === "register-athlete" && (
          <div>
            <div className="text-center mb-8">
              <Logo />
              <h2 className="text-3xl font-black mb-2 text-white">
                Criar Conta de Atleta
              </h2>
              <p className="text-gray-400">Preencha os dados abaixo</p>
            </div>
            {apiError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {apiError}
              </div>
            )}
            <form onSubmit={handleRegisterAthlete} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={athleteData.firstName}
                    placeholder="João"
                    onChange={(e) => {
                      setAthleteData((d) => ({
                        ...d,
                        firstName: e.target.value,
                      }));
                      setErrors((v) => ({ ...v, firstName: "" }));
                    }}
                    className={inputClass(errors.firstName)}
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={athleteData.lastName}
                    placeholder="Silva"
                    onChange={(e) => {
                      setAthleteData((d) => ({
                        ...d,
                        lastName: e.target.value,
                      }));
                      setErrors((v) => ({ ...v, lastName: "" }));
                    }}
                    className={inputClass(errors.lastName)}
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Email
                </label>
                <input
                  type="email"
                  value={athleteData.email}
                  placeholder="seu@email.com"
                  onChange={(e) => {
                    setAthleteData((d) => ({ ...d, email: e.target.value }));
                    setErrors((v) => ({ ...v, email: "" }));
                  }}
                  className={inputClass(errors.email)}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Senha
                </label>
                <PasswordInput
                  id="ath-pw"
                  name="password"
                  value={athleteData.password}
                  placeholder="Mínimo 6 caracteres"
                  onChange={(e) => {
                    setAthleteData((d) => ({ ...d, password: e.target.value }));
                    setErrors((v) => ({ ...v, password: "" }));
                  }}
                  error={errors.password}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Confirmar Senha
                </label>
                <PasswordInput
                  id="ath-cpw"
                  name="confirmPassword"
                  value={athleteData.confirmPassword}
                  placeholder="Repita sua senha"
                  onChange={(e) => {
                    setAthleteData((d) => ({
                      ...d,
                      confirmPassword: e.target.value,
                    }));
                    setErrors((v) => ({ ...v, confirmPassword: "" }));
                  }}
                  error={errors.confirmPassword}
                />
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="ath-terms"
                  checked={athleteAcceptedTerms}
                  onChange={(e) => {
                    setAthleteAcceptedTerms(e.target.checked);
                    setErrors((v) => ({ ...v, terms: "" }));
                  }}
                  className="mt-0.5 w-4 h-4 accent-[#00ff88] cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="ath-terms"
                  className="text-xs text-gray-400 cursor-pointer leading-relaxed"
                >
                  Li e aceito os{" "}
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00ff88] hover:underline"
                  >
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a
                    href="/privacidade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00ff88] hover:underline"
                  >
                    Política de Privacidade
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-400 text-xs">{errors.terms}</p>
              )}
              <SubmitBtn label="Criar Conta" />
            </form>
            <BackBtn to="select-type" />
          </div>
        )}

        {/* ── CADASTRO CLUBE ── */}
        {view === "register-club" && (
          <div>
            <div className="text-center mb-8">
              <Logo />
              <h2 className="text-3xl font-black mb-2 text-white">
                Criar Conta de Clube
              </h2>
              <p className="text-gray-400">Preencha os dados abaixo</p>
            </div>
            {apiError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {apiError}
              </div>
            )}
            <form onSubmit={handleRegisterClub} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Nome do Clube
                </label>
                <input
                  type="text"
                  value={clubData.clubName}
                  placeholder="Ex: Arena Padel Club"
                  onChange={(e) => {
                    setClubData((d) => ({ ...d, clubName: e.target.value }));
                    setErrors((v) => ({ ...v, clubName: "" }));
                  }}
                  className={inputClass(errors.clubName)}
                />
                {errors.clubName && (
                  <p className="text-red-400 text-sm mt-1">{errors.clubName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={clubData.cnpj}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  onChange={(e) => {
                    setClubData((d) => ({
                      ...d,
                      cnpj: formatCNPJ(e.target.value),
                    }));
                    setErrors((v) => ({ ...v, cnpj: "" }));
                  }}
                  className={inputClass(errors.cnpj)}
                />
                {errors.cnpj && (
                  <p className="text-red-400 text-sm mt-1">{errors.cnpj}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Email
                </label>
                <input
                  type="email"
                  value={clubData.email}
                  placeholder="contato@seuclube.com.br"
                  onChange={(e) => {
                    setClubData((d) => ({ ...d, email: e.target.value }));
                    setErrors((v) => ({ ...v, email: "" }));
                  }}
                  className={inputClass(errors.email)}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Senha
                </label>
                <PasswordInput
                  id="club-pw"
                  name="password"
                  value={clubData.password}
                  placeholder="Mínimo 6 caracteres"
                  onChange={(e) => {
                    setClubData((d) => ({ ...d, password: e.target.value }));
                    setErrors((v) => ({ ...v, password: "" }));
                  }}
                  error={errors.password}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Confirmar Senha
                </label>
                <PasswordInput
                  id="club-cpw"
                  name="confirmPassword"
                  value={clubData.confirmPassword}
                  placeholder="Repita sua senha"
                  onChange={(e) => {
                    setClubData((d) => ({
                      ...d,
                      confirmPassword: e.target.value,
                    }));
                    setErrors((v) => ({ ...v, confirmPassword: "" }));
                  }}
                  error={errors.confirmPassword}
                />
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="club-terms"
                  checked={clubAcceptedTerms}
                  onChange={(e) => {
                    setClubAcceptedTerms(e.target.checked);
                    setErrors((v) => ({ ...v, terms: "" }));
                  }}
                  className="mt-0.5 w-4 h-4 accent-[#00ff88] cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="club-terms"
                  className="text-xs text-gray-400 cursor-pointer leading-relaxed"
                >
                  Li e aceito os{" "}
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00ff88] hover:underline"
                  >
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a
                    href="/privacidade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00ff88] hover:underline"
                  >
                    Política de Privacidade
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-400 text-xs">{errors.terms}</p>
              )}
              <SubmitBtn label="Criar Conta" />
            </form>
            <BackBtn to="select-type" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
