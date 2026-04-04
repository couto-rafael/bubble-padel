import React from "react";

// ─── PILL TABS (Dark theme — Atleta) ─────────────────────────────────────────

interface PillTabsProps {
  tabs: Array<{ key: string; label: string; count?: number }>;
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export const PillTabs: React.FC<PillTabsProps> = ({
  tabs,
  active,
  onChange,
  className = "",
}) => (
  <div
    className={[
      "flex gap-0.5 p-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl",
      className,
    ].join(" ")}
  >
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={[
          "flex-1 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150",
          active === tab.key
            ? "bg-[#00e87a] text-[#0a0e1a]"
            : "text-[#6b7a99] hover:text-[#f0f4ff]",
        ].join(" ")}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span
            className={[
              "ml-1.5 text-[11px] font-bold",
              active === tab.key ? "opacity-70" : "opacity-50",
            ].join(" ")}
          >
            ({tab.count})
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─── LINE TABS (Light theme — Clube) ─────────────────────────────────────────

interface LineTabsProps {
  tabs: Array<{ key: string; label: string; count?: number }>;
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export const LineTabs: React.FC<LineTabsProps> = ({
  tabs,
  active,
  onChange,
  className = "",
}) => (
  <div
    className={[
      "flex border-b border-gray-200 overflow-x-auto",
      className,
    ].join(" ")}
  >
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={[
          "px-5 py-3 text-[14px] font-bold whitespace-nowrap",
          "border-b-2 -mb-px transition-all duration-150",
          active === tab.key
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700",
        ].join(" ")}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className="ml-1.5 text-[12px] opacity-60">({tab.count})</span>
        )}
      </button>
    ))}
  </div>
);

// ─── BOTTOM NAV (Mobile Atleta) ───────────────────────────────────────────────

interface BottomNavItem {
  key: string;
  label: string;
  icon: string;
}

interface BottomNavProps {
  items: BottomNavItem[];
  active: string;
  onChange: (key: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  active,
  onChange,
}) => (
  <div className="flex bg-[#0e121e]/[0.98] backdrop-blur-xl border-t border-white/[0.08] pb-safe">
    {items.map((item) => (
      <button
        key={item.key}
        onClick={() => onChange(item.key)}
        className={[
          "flex-1 flex flex-col items-center gap-1 py-2.5 px-2",
          "text-[10px] font-bold transition-colors duration-150",
          active === item.key ? "text-[#00e87a]" : "text-[#6b7a99]",
        ].join(" ")}
      >
        <span className="text-xl leading-none">{item.icon}</span>
        {item.label}
      </button>
    ))}
  </div>
);
