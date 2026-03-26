import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";

// Página pública para o Jogador 2 pagar sem precisar de login
// Acessada via link único: /pay/:token

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

interface PaymentInfo {
  playerName: string;
  playerEmail: string;
  tournamentName: string;
  category: string;
  amount: number;
  status: string;
  billingUrl: string;
  billingId: string;
  teamId: string;
  tournamentId: string;
}

type Step =
  | "loading"
  | "ready"
  | "polling"
  | "paid"
  | "expired"
  | "error"
  | "already_paid";

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>("loading");
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (token) loadPaymentInfo();
  }, [token]);

  const loadPaymentInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/pay/${token}`);
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "Link inválido ou expirado.");
        setStep("error");
        return;
      }

      const data: PaymentInfo = json.data;
      setInfo(data);

      if (data.status === "PAID") {
        setStep("already_paid");
      } else if (data.status === "EXPIRED") {
        setStep("expired");
      } else {
        setStep("ready");
        startPolling(data.billingId);
      }
    } catch {
      setErrorMsg("Erro ao carregar informações de pagamento.");
      setStep("error");
    }
  };

  const startPolling = useCallback((billingId: string) => {
    let attempts = 0;
    const MAX = 120;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > MAX) {
        clearInterval(interval);
        setStep("expired");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/payments/pix/status/${billingId}`);
        const json = await res.json();
        const status: string = json.data?.status ?? "";
        if (status === "PAID") {
          clearInterval(interval);
          setStep("paid");
        } else if (status === "EXPIRED" || status === "CANCELLED") {
          clearInterval(interval);
          setStep("expired");
        }
      } catch {
        /* ignora */
      }
    }, 5000);
  }, []);

  const handleCopy = () => {
    if (!info?.billingUrl) return;
    navigator.clipboard.writeText(info.billingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#050f1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#050f1a]"
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
            <span className="text-xl font-bold text-white">Bubble Padel</span>
          </Link>
        </div>

        <div className="bg-[#0d2037] border border-white/10 rounded-2xl overflow-hidden">
          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Carregando pagamento...</p>
            </div>
          )}

          {/* Pronto para pagar */}
          {(step === "ready" || step === "polling") && info && (
            <>
              <div className="px-6 py-5 border-b border-white/10">
                <p className="text-xs text-[#00ff88] font-semibold uppercase tracking-wider mb-1">
                  Pagamento de Inscrição
                </p>
                <h1 className="text-xl font-bold text-white">
                  {info.tournamentName}
                </h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  Categoria: {info.category}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Resumo */}
                <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Sua parte</p>
                    <p className="font-semibold text-white">
                      {info.playerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Valor</p>
                    <p className="text-2xl font-black text-[#00ff88]">
                      R$ {info.amount.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-300 text-center">
                  Abra o app do seu banco, escolha{" "}
                  <strong>Pagar com PIX</strong> e use o botão abaixo.
                </p>

                <a
                  href={info.billingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#00ff88] text-[#050f1a] rounded-xl font-bold text-base hover:bg-[#00dd77] transition-colors flex items-center justify-center gap-2"
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
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
                    />
                  </svg>
                  Abrir página de pagamento PIX
                </a>

                <button
                  onClick={handleCopy}
                  className="w-full py-2.5 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors border border-white/10"
                >
                  {copied ? "✓ Link copiado!" : "Copiar link de pagamento"}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  Aguardando confirmação... (expira em 30 min)
                </div>
              </div>
            </>
          )}

          {/* Pago ✅ */}
          {step === "paid" && info && (
            <div className="flex flex-col items-center py-10 gap-4 text-center px-6">
              <div className="w-16 h-16 bg-[#00ff88]/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#00ff88]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Pagamento confirmado! 🎾
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Sua inscrição em <strong>{info.tournamentName}</strong> está
                  confirmada. Você receberá um email com os detalhes.
                </p>
              </div>
              <Link
                to={`/tournaments/${info.tournamentId}`}
                className="mt-2 px-6 py-2.5 bg-[#00ff88] text-[#050f1a] rounded-xl font-bold text-sm hover:bg-[#00dd77] transition-colors"
              >
                Ver torneio →
              </Link>
            </div>
          )}

          {/* Já pago */}
          {step === "already_paid" && info && (
            <div className="flex flex-col items-center py-10 gap-4 text-center px-6">
              <div className="w-16 h-16 bg-[#00ff88]/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#00ff88]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Inscrição já confirmada!
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Este pagamento já foi processado.
                </p>
              </div>
              <Link
                to={`/tournaments/${info.tournamentId}`}
                className="mt-2 px-6 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
              >
                Ver torneio →
              </Link>
            </div>
          )}

          {/* Expirado */}
          {step === "expired" && (
            <div className="flex flex-col items-center py-10 gap-4 text-center px-6">
              <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-white">Link expirado</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Este link de pagamento expirou. Entre em contato com o
                  organizador do torneio para receber um novo link.
                </p>
              </div>
            </div>
          )}

          {/* Erro */}
          {step === "error" && (
            <div className="flex flex-col items-center py-10 gap-4 text-center px-6">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-red-400"
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
              </div>
              <div>
                <h2 className="font-bold text-white">Link inválido</h2>
                <p className="text-gray-400 text-sm mt-1">{errorMsg}</p>
              </div>
              <Link to="/" className="text-[#00ff88] text-sm hover:underline">
                Voltar ao início
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Bubble Padel ·{" "}
          <Link to="/termos" className="hover:text-gray-400">
            Termos de Uso
          </Link>
        </p>
      </div>
    </div>
  );
}
