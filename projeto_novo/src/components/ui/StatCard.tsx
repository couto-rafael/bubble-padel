import React from "react";

type StatTheme = "dark" | "light";
type StatAccent = "default" | "green" | "blue" | "orange" | "cyan" | "success";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  theme?: StatTheme;
  accent?: StatAccent;
  icon?: string;
  className?: string;
}

const accentValueClass: Record<StatAccent, Record<StatTheme, string>> = {
  default: { dark: "text-[#f0f4ff]",  light: "text-gray-900"  },
  green:   { dark: "text-[#00e87a]",  light: "text-green-600" },
  blue:    { dark: "text-[#00c8ff]",  light: "text-blue-600"  },
  orange:  { dark: "text-[#ff6b35]",  light: "text-orange-600"},
  cyan:    { dark: "text-[#00c8ff]",  light: "text-cyan-600"  },
  success: { dark: "text-[#00e87a]",  light: "text-green-600" },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  theme = "light",
  accent = "default",
  icon,
  className = "",
}) => {
  const isDark = theme === "dark";

  return (
    <div
      className={[
        "rounded-2xl p-5",
        isDark
          ? "bg-[#141824] border border-white/[0.08]"
          : "bg-white border border-gray-200 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-2">
        <p
          className={[
            "text-[11px] font-bold uppercase tracking-widest",
            isDark ? "text-[#6b7a99]" : "text-gray-500",
          ].join(" ")}
        >
          {label}
        </p>
        {icon && <span className="text-xl opacity-60">{icon}</span>}
      </div>
      <p
        className={[
          "text-[32px] font-extrabold leading-none tracking-tight mb-1",
          accentValueClass[accent][theme],
        ].join(" ")}
      >
        {value}
      </p>
      {sub && (
        <p
          className={[
            "text-[12px] font-normal",
            isDark ? "text-[#6b7a99]" : "text-gray-500",
          ].join(" ")}
        >
          {sub}
        </p>
      )}
    </div>
  );
};
