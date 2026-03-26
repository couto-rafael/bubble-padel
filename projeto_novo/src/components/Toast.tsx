import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  dismiss: (id: string) => void;
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-dismiss em 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string) => add("success", msg),
    error: (msg: string) => add("error", msg),
    warning: (msg: string) => add("warning", msg),
    info: (msg: string) => add("info", msg),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── CONTAINER ───────────────────────────────────────────────────────────────

const icons: Record<ToastType, string> = {
  success: "M5 13l4 4L19 7",
  error: "M6 18L18 6M6 6l12 12",
  warning:
    "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const styles: Record<
  ToastType,
  { bg: string; border: string; icon: string; text: string }
> = {
  success: {
    bg: "bg-[#050f1a]",
    border: "border-[#00ff88]/40",
    icon: "text-[#00ff88]",
    text: "text-white",
  },
  error: {
    bg: "bg-[#050f1a]",
    border: "border-red-500/40",
    icon: "text-red-400",
    text: "text-white",
  },
  warning: {
    bg: "bg-[#050f1a]",
    border: "border-amber-500/40",
    icon: "text-amber-400",
    text: "text-white",
  },
  info: {
    bg: "bg-[#050f1a]",
    border: "border-blue-500/40",
    icon: "text-blue-400",
    text: "text-white",
  },
};

function ToastItem({
  toast,
  dismiss,
}: {
  toast: Toast;
  dismiss: (id: string) => void;
}) {
  const s = styles[toast.type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para animar entrada
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl
        ${s.bg} ${s.border} ${s.text}
        transition-all duration-300
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        max-w-sm w-full
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${s.icon}`}>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={icons[toast.type]}
          />
        </svg>
      </div>

      {/* Message */}
      <p className="text-sm flex-1 leading-snug">{toast.message}</p>

      {/* Close */}
      <button
        onClick={() => dismiss(toast.id)}
        className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} dismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
