import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/api";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
  defaultView?: "login" | "select-type" | "register-athlete" | "register-club";
}

type ModalView = "login" | "select-type" | "register-athlete" | "register-club";

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    className="w-4 h-4"
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

// Input base DS v2 — dark theme
const inputCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border-[1.5px] text-sm font-medium bg-[#1e2538] text-[#f0f4ff] placeholder:text-[#6b7a99] outline-none transition-all duration-150 ${
    err
      ? "border-[#ff4757] ring-[3px] ring-[#ff4757]/10"
      : "border-white/[0.08] focus:border-[#00e87a] focus:ring-[3px] focus:ring-[#00e87a]/10"
  }`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="text-[#ff4757] text-xs font-medium mt-1.5">{msg}</p>
  ) : null;

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
          className={`${inputCls(error)} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7a99] hover:text-[#00e87a] transition-colors"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      <FieldError msg={error} />
    </div>
  );
};

// Checkbox LGPD
const TermsCheck = ({
  id,
  checked,
  onChange,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) => (
  <div>
    <div className="flex items-start gap-2.5">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-[#00e87a] cursor-pointer flex-shrink-0"
      />
      <label
        htmlFor={id}
        className="text-xs text-[#6b7a99] cursor-pointer leading-relaxed"
      >
        Li e aceito os{" "}
        <a
          href="/termos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00e87a] hover:underline font-semibold"
        >
          Termos de Uso
        </a>{" "}
        e a{" "}
        <a
          href="/privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00e87a] hover:underline font-semibold"
        >
          Política de Privacidade
        </a>
      </label>
    </div>
    <FieldError msg={error} />
  </div>
);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  returnUrl,
  defaultView,
}) => {
  const navigate = useNavigate();
  const [view, setView] = useState<ModalView>(defaultView ?? "login");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [athleteData, setAthleteData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [athleteAcceptedTerms, setAthleteAcceptedTerms] = useState(false);
  const [clubData, setClubData] = useState({
    clubName: "",
    cnpj: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [clubAcceptedTerms, setClubAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────────

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
    setAthleteAcceptedTerms(false);
    setClubAcceptedTerms(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const goBack = (to: ModalView) => {
    setView(to);
    setErrors({});
    setApiError("");
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

  // ── Handlers (lógica 100% preservada) ────────────────────────────────────────

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
      navigate(returnUrl ?? "/athlete/dashboard");
    } catch (err: any) {
      setApiError(err.message ?? "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

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
      navigate("/dashboard/settings?welcome=true");
    } catch (err: any) {
      setApiError(err.message ?? "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  // ── UI Helpers ────────────────────────────────────────────────────────────────

  const Logo = () => (
    <div className="flex items-center justify-center gap-2.5 mb-6">
      <div className="w-9 h-9 bg-gradient-to-br from-[#00e87a] to-[#00b85f] rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(0,232,122,0.3)]">
        <svg
          className="w-5 h-5 text-[#0a0e1a]"
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
      <span className="text-[19px] font-extrabold text-[#f0f4ff] tracking-tight">
        Bubble
      </span>
    </div>
  );

  const SubmitBtn = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 bg-[#00e87a] text-[#0a0e1a] font-extrabold text-[14px] rounded-xl hover:bg-[#00ff88] hover:shadow-[0_0_20px_rgba(0,232,122,0.3)] transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-[#0a0e1a]/20 border-t-[#0a0e1a] rounded-full animate-spin inline-block" />
      )}
      {loading ? "Aguarde..." : label}
    </button>
  );

  const ApiError = () =>
    apiError ? (
      <div className="mb-4 p-3 bg-[#ff4757]/10 border border-[#ff4757]/25 rounded-xl text-[#ff4757] text-sm font-medium">
        {apiError}
      </div>
    ) : null;

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[12px] font-semibold text-[#6b7a99] mb-1.5">
      {children}
    </label>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#141824] border border-white/10 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in">
        {/* Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.06] text-[#6b7a99] hover:text-[#f0f4ff] hover:bg-white/10 transition-all flex items-center justify-center z-10"
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

        <div className="p-7">
          {/* ── LOGIN ────────────────────────────────────────────────────────── */}
          {view === "login" && (
            <div>
              <div className="text-center mb-7">
                <Logo />
                <h2 className="text-[26px] font-extrabold text-[#f0f4ff] tracking-tight mb-1.5">
                  Entrar
                </h2>
                <p className="text-[#6b7a99] text-sm">
                  Acesse sua conta Bubble Padel
                </p>
              </div>
              <ApiError />
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    value={loginData.email}
                    placeholder="seu@email.com"
                    onChange={(e) => {
                      setLoginData((d) => ({ ...d, email: e.target.value }));
                      setErrors((v) => ({ ...v, email: "" }));
                    }}
                    className={inputCls(errors.email)}
                  />
                  <FieldError msg={errors.email} />
                </div>
                <div>
                  <FieldLabel>Senha</FieldLabel>
                  <PasswordInput
                    id="login-pw"
                    name="password"
                    value={loginData.password}
                    placeholder="Sua senha"
                    error={errors.password}
                    onChange={(e) => {
                      setLoginData((d) => ({ ...d, password: e.target.value }));
                      setErrors((v) => ({ ...v, password: "" }));
                    }}
                  />
                </div>
                <SubmitBtn label="Entrar" />
              </form>
              <div className="mt-5 text-center">
                <p className="text-[#6b7a99] text-sm">
                  Não tem conta?{" "}
                  <button
                    onClick={() => setView("select-type")}
                    className="text-[#00e87a] hover:underline font-bold"
                  >
                    Criar conta
                  </button>
                </p>
              </div>

              {/* Social login — Em breve */}
              <div className="mt-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-[11px] font-semibold text-[#6b7a99] uppercase tracking-wider">
                    ou entre com
                  </span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] font-semibold text-[#6b7a99] cursor-not-allowed opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google — Em breve
                </button>
              </div>
            </div>
          )}

          {/* ── SELECIONAR TIPO ──────────────────────────────────────────────── */}
          {view === "select-type" && (
            <div>
              <div className="text-center mb-7">
                <Logo />
                <h2 className="text-[26px] font-extrabold text-[#f0f4ff] tracking-tight mb-1.5">
                  Criar Conta
                </h2>
                <p className="text-[#6b7a99] text-sm">
                  Qual tipo de conta você precisa?
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    type: "register-athlete" as ModalView,
                    icon: "🎾",
                    title: "Sou Atleta",
                    desc: "Me inscrevo em torneios e acompanho meus resultados",
                  },
                  {
                    type: "register-club" as ModalView,
                    icon: "🏢",
                    title: "Sou um Clube",
                    desc: "Organizo torneios e gerencio minhas quadras",
                  },
                ].map(({ type, icon, title, desc }) => (
                  <button
                    key={type}
                    onClick={() => setView(type)}
                    className="w-full p-5 bg-[#1e2538] hover:bg-[#252d42] border border-white/[0.08] hover:border-[#00e87a]/30 rounded-2xl transition-all duration-150 group text-left flex items-center gap-4 active:scale-[0.99]"
                  >
                    <div className="w-12 h-12 bg-[#00e87a]/10 group-hover:bg-[#00e87a]/15 rounded-xl flex items-center justify-center text-2xl transition-colors flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-[#f0f4ff] mb-0.5">
                        {title}
                      </p>
                      <p className="text-[12px] text-[#6b7a99] font-normal leading-relaxed">
                        {desc}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-[#6b7a99] group-hover:text-[#00e87a] transition-colors flex-shrink-0"
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
                  </button>
                ))}
              </div>
              <button
                onClick={() => goBack("login")}
                className="w-full mt-4 text-[#6b7a99] hover:text-[#f0f4ff] text-sm font-medium transition-colors py-2"
              >
                ← Voltar para login
              </button>
            </div>
          )}

          {/* ── CADASTRO ATLETA ──────────────────────────────────────────────── */}
          {view === "register-athlete" && (
            <div>
              <div className="text-center mb-7">
                <Logo />
                <h2 className="text-[24px] font-extrabold text-[#f0f4ff] tracking-tight mb-1.5">
                  Criar Conta de Atleta
                </h2>
                <p className="text-[#6b7a99] text-sm">
                  Preencha seus dados para começar
                </p>
              </div>
              <ApiError />
              <form onSubmit={handleRegisterAthlete} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Nome</FieldLabel>
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
                      className={inputCls(errors.firstName)}
                    />
                    <FieldError msg={errors.firstName} />
                  </div>
                  <div>
                    <FieldLabel>Sobrenome</FieldLabel>
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
                      className={inputCls(errors.lastName)}
                    />
                    <FieldError msg={errors.lastName} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    value={athleteData.email}
                    placeholder="joao@email.com"
                    onChange={(e) => {
                      setAthleteData((d) => ({ ...d, email: e.target.value }));
                      setErrors((v) => ({ ...v, email: "" }));
                    }}
                    className={inputCls(errors.email)}
                  />
                  <FieldError msg={errors.email} />
                </div>
                <div>
                  <FieldLabel>Senha</FieldLabel>
                  <PasswordInput
                    id="ath-pw"
                    name="password"
                    value={athleteData.password}
                    placeholder="Mínimo 6 caracteres"
                    error={errors.password}
                    onChange={(e) => {
                      setAthleteData((d) => ({
                        ...d,
                        password: e.target.value,
                      }));
                      setErrors((v) => ({ ...v, password: "" }));
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Confirmar Senha</FieldLabel>
                  <PasswordInput
                    id="ath-cpw"
                    name="confirmPassword"
                    value={athleteData.confirmPassword}
                    placeholder="Repita sua senha"
                    error={errors.confirmPassword}
                    onChange={(e) => {
                      setAthleteData((d) => ({
                        ...d,
                        confirmPassword: e.target.value,
                      }));
                      setErrors((v) => ({ ...v, confirmPassword: "" }));
                    }}
                  />
                </div>
                <TermsCheck
                  id="ath-terms"
                  checked={athleteAcceptedTerms}
                  onChange={(v) => {
                    setAthleteAcceptedTerms(v);
                    setErrors((e) => ({ ...e, terms: "" }));
                  }}
                  error={errors.terms}
                />
                <SubmitBtn label="Criar Conta" />

                {/* Social — Em breve */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-[11px] font-semibold text-[#6b7a99] uppercase tracking-wider">
                    ou
                  </span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] font-semibold text-[#6b7a99] cursor-not-allowed opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Cadastrar com Google — Em breve
                </button>
              </form>
              <button
                onClick={() => goBack("select-type")}
                className="w-full mt-4 text-[#6b7a99] hover:text-[#f0f4ff] text-sm font-medium transition-colors py-2"
              >
                ← Voltar
              </button>
            </div>
          )}

          {/* ── CADASTRO CLUBE ───────────────────────────────────────────────── */}
          {view === "register-club" && (
            <div>
              <div className="text-center mb-7">
                <Logo />
                <h2 className="text-[24px] font-extrabold text-[#f0f4ff] tracking-tight mb-1.5">
                  Criar Conta de Clube
                </h2>
                <p className="text-[#6b7a99] text-sm">
                  Dados do seu clube organizador
                </p>
              </div>
              <ApiError />
              <form onSubmit={handleRegisterClub} className="space-y-4">
                <div>
                  <FieldLabel>Nome do Clube</FieldLabel>
                  <input
                    type="text"
                    value={clubData.clubName}
                    placeholder="Ex: Arena Padel Club"
                    onChange={(e) => {
                      setClubData((d) => ({ ...d, clubName: e.target.value }));
                      setErrors((v) => ({ ...v, clubName: "" }));
                    }}
                    className={inputCls(errors.clubName)}
                  />
                  <FieldError msg={errors.clubName} />
                </div>
                <div>
                  <FieldLabel>CNPJ</FieldLabel>
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
                    className={inputCls(errors.cnpj)}
                  />
                  <FieldError msg={errors.cnpj} />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    value={clubData.email}
                    placeholder="contato@seuclube.com.br"
                    onChange={(e) => {
                      setClubData((d) => ({ ...d, email: e.target.value }));
                      setErrors((v) => ({ ...v, email: "" }));
                    }}
                    className={inputCls(errors.email)}
                  />
                  <FieldError msg={errors.email} />
                </div>
                <div>
                  <FieldLabel>Senha</FieldLabel>
                  <PasswordInput
                    id="club-pw"
                    name="password"
                    value={clubData.password}
                    placeholder="Mínimo 6 caracteres"
                    error={errors.password}
                    onChange={(e) => {
                      setClubData((d) => ({ ...d, password: e.target.value }));
                      setErrors((v) => ({ ...v, password: "" }));
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Confirmar Senha</FieldLabel>
                  <PasswordInput
                    id="club-cpw"
                    name="confirmPassword"
                    value={clubData.confirmPassword}
                    placeholder="Repita sua senha"
                    error={errors.confirmPassword}
                    onChange={(e) => {
                      setClubData((d) => ({
                        ...d,
                        confirmPassword: e.target.value,
                      }));
                      setErrors((v) => ({ ...v, confirmPassword: "" }));
                    }}
                  />
                </div>
                <TermsCheck
                  id="club-terms"
                  checked={clubAcceptedTerms}
                  onChange={(v) => {
                    setClubAcceptedTerms(v);
                    setErrors((e) => ({ ...e, terms: "" }));
                  }}
                  error={errors.terms}
                />
                <SubmitBtn label="Criar Conta de Clube" />
              </form>
              <button
                onClick={() => goBack("select-type")}
                className="w-full mt-4 text-[#6b7a99] hover:text-[#f0f4ff] text-sm font-medium transition-colors py-2"
              >
                ← Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
