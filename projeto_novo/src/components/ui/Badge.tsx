import React from "react";

type BadgeColor =
  | "green-dark"
  | "cyan-dark"
  | "orange-dark"
  | "gray-dark"
  | "danger-dark"
  | "amber-dark"
  | "purple-dark"
  | "gold-dark"
  | "silver-dark"
  | "bronze-dark"
  | "green-light"
  | "blue-light"
  | "amber-light"
  | "gray-light"
  | "red-light"
  | "purple-light";

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  "green-dark":  "bg-[#00e87a]/10  text-[#00e87a]  border border-[#00e87a]/20",
  "cyan-dark":   "bg-[#00c8ff]/10  text-[#00c8ff]  border border-[#00c8ff]/20",
  "orange-dark": "bg-[#ff6b35]/10  text-[#ff6b35]  border border-[#ff6b35]/20",
  "gray-dark":   "bg-white/[0.06]  text-[#6b7a99]  border border-white/10",
  "danger-dark": "bg-[#ff4757]/10  text-[#ff4757]  border border-[#ff4757]/20",
  "amber-dark":  "bg-amber-400/10  text-amber-400  border border-amber-400/20",
  "purple-dark": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  "gold-dark":   "bg-yellow-400/10 text-yellow-400 border border-yellow-400/25",
  "silver-dark": "bg-slate-400/10  text-slate-400  border border-slate-400/20",
  "bronze-dark": "bg-amber-700/10  text-amber-600  border border-amber-700/20",
  "green-light": "bg-green-50  text-green-700",
  "blue-light":  "bg-blue-50   text-blue-700",
  "amber-light": "bg-amber-50  text-amber-700",
  "gray-light":  "bg-gray-100  text-gray-600  border border-gray-200",
  "red-light":   "bg-red-50    text-red-700",
  "purple-light":"bg-purple-50 text-purple-700",
};

export const Badge: React.FC<BadgeProps> = ({
  color = "gray-light",
  children,
  className = "",
}) => (
  <span
    className={[
      "inline-flex items-center gap-1.5 px-2.5 py-1",
      "rounded-full text-[12px] font-bold",
      colorClasses[color],
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

// ─── STATUS BADGE — mapeia status do torneio automaticamente ───────────────────

type TournamentStatus =
  | "draft" | "DRAFT"
  | "published" | "PUBLISHED"
  | "open" | "OPEN"
  | "closed" | "CLOSED"
  | "ongoing" | "ONGOING"
  | "completed" | "COMPLETED";

const statusMap: Record<string, { color: BadgeColor; label: string }> = {
  draft:     { color: "amber-dark",  label: "Rascunho" },
  published: { color: "blue-light",  label: "Publicado" },
  open:      { color: "green-light", label: "Inscrições Abertas" },
  closed:    { color: "red-light",   label: "Encerrado" },
  ongoing:   { color: "cyan-dark",   label: "Em Andamento" },
  completed: { color: "purple-light",label: "Finalizado" },
};

export const StatusBadge: React.FC<{ status: TournamentStatus }> = ({
  status,
}) => {
  const key = status.toLowerCase();
  const config = statusMap[key] ?? { color: "gray-light" as BadgeColor, label: status };
  return <Badge color={config.color}>{config.label}</Badge>;
};
