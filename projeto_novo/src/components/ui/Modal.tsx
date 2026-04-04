import React, { useEffect } from "react";

type ModalTheme = "dark" | "light";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  theme?: ModalTheme;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  theme = "light",
  maxWidth = "max-w-lg",
  children,
  footer,
}) => {
  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const isDark = theme === "dark";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={[
          "w-full rounded-2xl overflow-hidden flex flex-col max-h-[90vh]",
          "shadow-2xl",
          maxWidth,
          isDark
            ? "bg-[#141824] border border-white/10"
            : "bg-white",
        ].join(" ")}
      >
        {/* Header */}
        <div
          className={[
            "flex items-center justify-between px-6 py-5 flex-shrink-0",
            isDark ? "border-b border-white/[0.08]" : "border-b border-gray-100",
          ].join(" ")}
        >
          <h2
            className={[
              "text-[17px] font-extrabold tracking-tight",
              isDark ? "text-[#f0f4ff]" : "text-gray-900",
            ].join(" ")}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={[
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-[15px]",
              isDark
                ? "bg-white/[0.06] text-[#6b7a99] hover:bg-white/10"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
            ].join(" ")}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className={[
              "px-6 py-4 flex gap-3 flex-shrink-0",
              isDark ? "border-t border-white/[0.08]" : "border-t border-gray-100",
            ].join(" ")}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
