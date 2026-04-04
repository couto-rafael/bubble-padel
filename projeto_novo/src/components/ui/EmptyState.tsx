import React from "react";

type EmptyStateTheme = "dark" | "light";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  theme?: EmptyStateTheme;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  theme = "light",
  className = "",
}) => {
  const isDark = theme === "dark";

  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl",
        isDark
          ? "bg-white/[0.015] border-[1.5px] border-dashed border-white/10"
          : "bg-gray-50 border-2 border-dashed border-gray-200",
        className,
      ].join(" ")}
    >
      {icon && (
        <span className="text-4xl mb-4 block opacity-50">{icon}</span>
      )}
      <p
        className={[
          "text-[17px] font-extrabold mb-2 tracking-tight",
          isDark ? "text-[#f0f4ff]" : "text-gray-800",
        ].join(" ")}
      >
        {title}
      </p>
      {description && (
        <p
          className={[
            "text-[14px] max-w-xs mb-6 font-normal leading-relaxed",
            isDark ? "text-[#6b7a99]" : "text-gray-500",
          ].join(" ")}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
};
