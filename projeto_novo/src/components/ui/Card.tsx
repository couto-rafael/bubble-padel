import React from "react";

type CardVariant =
  | "dark"
  | "dark-elevated"
  | "dark-accent"
  | "light"
  | "light-shadow"
  | "light-accent";

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantClasses: Record<CardVariant, string> = {
  "dark":
    "bg-[#141824] border border-white/[0.08] rounded-2xl",
  "dark-elevated":
    "bg-gradient-to-br from-[#1e2538] to-[#141824] border border-white/10 rounded-2xl",
  "dark-accent":
    "bg-gradient-to-br from-[#00e87a]/[0.08] to-[#00c8ff]/[0.04] border border-[#00e87a]/20 rounded-2xl",
  "light":
    "bg-white border border-gray-200 rounded-2xl shadow-sm",
  "light-shadow":
    "bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
  "light-accent":
    "bg-gradient-to-br from-blue-600/[0.05] to-blue-600/[0.02] border border-blue-600/15 rounded-2xl",
};

export const Card: React.FC<CardProps> = ({
  variant = "light",
  className = "",
  children,
  onClick,
}) => (
  <div
    className={[
      variantClasses[variant],
      "p-6",
      onClick ? "cursor-pointer transition-all duration-150 hover:scale-[1.01]" : "",
      className,
    ].join(" ")}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── CARD HEADER / TITLE / DESC helpers ───────────────────────────────────────

interface CardTitleProps {
  theme?: "dark" | "light";
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  theme = "light",
  children,
  className = "",
}) => (
  <p
    className={[
      "text-[15px] font-bold leading-tight mb-1.5",
      theme === "dark" ? "text-[#f0f4ff]" : "text-gray-900",
      className,
    ].join(" ")}
  >
    {children}
  </p>
);

export const CardDesc: React.FC<CardTitleProps> = ({
  theme = "light",
  children,
  className = "",
}) => (
  <p
    className={[
      "text-[13px] leading-relaxed font-normal",
      theme === "dark" ? "text-[#6b7a99]" : "text-gray-500",
      className,
    ].join(" ")}
  >
    {children}
  </p>
);
