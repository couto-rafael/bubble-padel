import { useState, useEffect, useCallback } from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  teamId: string;
  tournamentId: string;
  playerName: string;
  playerEmail: string;
  playerNumber: 1 | 2;
  amount: number; // valor total da dupla
  tournamentName: string;
  category: string;
  onPaid: () => void; // chamado quando pagamento confirmado
  onClose: () => void;
  isFree: boolean; // torneio gratuito → pular pagamento
}

type Step = "loading" | "qrcode" | "polling" | "paid" | "expired" | "error";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function PaymentModal({
  teamId,
  tournamentId,
  playerName,
  playerNumber,
  amount,
  tournamentName,
  category,
  onPaid,
  onClose,
  isFree,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>("loading");
  const [billingUrl, setBillingUrl] = useState("");
  const [billingId, setBillingId] = useState("");
  const [copied, setCopied] = useState(false);
  const amountPerPlayer = amount / 2;

  // ── Cria a cobrança ao montar ─────────────────────────────────────────────
  useEffect(() => {
    if (isFree) {
      // Torneio gratuito → confirma direto
      onPaid();
      return;
    }
    createCharge();
  }, []);

  const createCharge = async () => {
    setStep("loading");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/payments/pix/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId, playerNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao gerar PIX");

      setBillingUrl(json.data.billingUrl);
      setBillingId(json.data.billingId);
      setStep("qrcode");
      startPolling(json.data.billingId);
    } catch (err: any) {
      console.error(err);
      setStep("error");
    }
  };

  // ── Polling de status a cada 5s ───────────────────────────────────────────
  const startPolling = useCallback(
    (id: string) => {
      let attempts = 0;
      const MAX_ATTEMPTS = 120; // 10 minutos

      const interval = setInterval(async () => {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
          clearInterval(interval);
          setStep("expired");
          return;
        }

        try {
          const res = await fetch(`${API_URL}/payments/pix/status/${id}`);
          const json = await res.json();
          const status: string = json.data?.status ?? "";

          if (status === "PAID") {
            clearInterval(interval);
            setStep("paid");
            setTimeout(onPaid, 2000);
          } else if (status === "EXPIRED" || status === "CANCELLED") {
            clearInterval(interval);
            setStep("expired");
          }
        } catch {
          // ignora erros de rede no polling
        }
      }, 5000);

      return () => clearInterval(interval);
    },
    [onPaid],
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(billingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenPix = () => {
    window.open(billingUrl, "_blank");
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d2037] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-bold text-white">Pagamento PIX</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {tournamentName} · {category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
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

        {/* Body */}
        <div className="p-6">
          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Gerando QR Code PIX...</p>
            </div>
          )}

          {/* QR Code / Link */}
          {(step === "qrcode" || step === "polling") && (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pagador</p>
                  <p className="font-semibold text-white">{playerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Valor</p>
                  <p className="text-xl font-black text-[#00ff88]">
                    R$ {amountPerPlayer.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>

              {/* Instrução */}
              <p className="text-sm text-gray-300 text-center">
                Abra o app do seu banco, escolha <strong>Pagar com PIX</strong>{" "}
                e use o botão abaixo.
              </p>

              {/* CTA principal */}
              <button
                onClick={handleOpenPix}
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
              </button>

              {/* Copiar link */}
              <button
                onClick={handleCopy}
                className="w-full py-2.5 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors border border-white/10"
              >
                {copied ? "✓ Link copiado!" : "Copiar link de pagamento"}
              </button>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                Aguardando pagamento... (expira em 30 min)
              </div>
            </div>
          )}

          {/* Pago ✅ */}
          {step === "paid" && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
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
                <h3 className="text-xl font-bold text-white">
                  Pagamento confirmado!
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Seu parceiro receberá um link por email para pagar a parte
                  dele.
                </p>
              </div>
            </div>
          )}

          {/* Expirado ⏰ */}
          {step === "expired" && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
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
                <h3 className="font-bold text-white">PIX expirado</h3>
                <p className="text-gray-400 text-sm mt-1">
                  O código expirou. Gere um novo.
                </p>
              </div>
              <button
                onClick={createCharge}
                className="px-6 py-2.5 bg-[#00ff88] text-[#050f1a] rounded-xl font-bold text-sm hover:bg-[#00dd77] transition-colors"
              >
                Gerar novo PIX
              </button>
            </div>
          )}

          {/* Erro */}
          {step === "error" && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
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
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white">Erro ao gerar PIX</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Tente novamente ou entre em contato com o organizador.
                </p>
              </div>
              <button
                onClick={createCharge}
                className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
