import React from "react";

type Theme = "dark" | "light";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  theme?: Theme;
  label?: string;
  hint?: string;
  error?: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  theme?: Theme;
  label?: string;
  hint?: string;
  error?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  theme?: Theme;
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

const labelClass: Record<Theme, string> = {
  dark:  "text-[#6b7a99]",
  light: "text-gray-500",
};

const baseInputClass: Record<Theme, string> = {
  dark:  "bg-[#1e2538] border-white/[0.08] text-[#f0f4ff] placeholder:text-[#6b7a99] focus:border-[#00e87a] focus:ring-[#00e87a]/10",
  light: "bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:ring-blue-500/10",
};

const inputCls = (theme: Theme, hasError: boolean) =>
  [
    "w-full px-3.5 py-2.5 rounded-xl border-[1.5px] text-sm font-medium",
    "outline-none transition-all duration-150",
    "focus:ring-[3px]",
    hasError
      ? theme === "dark"
        ? "border-[#ff4757] ring-[#ff4757]/10"
        : "border-red-500 ring-red-500/10"
      : baseInputClass[theme],
  ].join(" ");

// ─── INPUT ────────────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ theme = "light", label, hint, error, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className={`text-xs font-semibold ${labelClass[theme]}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${inputCls(theme, !!error)} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-[#ff4757]">{error}</span>
      )}
      {!error && hint && (
        <span className={`text-xs ${labelClass[theme]}`}>{hint}</span>
      )}
    </div>
  ),
);
Input.displayName = "Input";

// ─── TEXTAREA ─────────────────────────────────────────────────────────────────

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { theme = "light", label, hint, error, className = "", rows = 3, ...props },
    ref,
  ) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className={`text-xs font-semibold ${labelClass[theme]}`}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`${inputCls(theme, !!error)} resize-none ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-[#ff4757]">{error}</span>
      )}
      {!error && hint && (
        <span className={`text-xs ${labelClass[theme]}`}>{hint}</span>
      )}
    </div>
  ),
);
Textarea.displayName = "Textarea";

// ─── SELECT ───────────────────────────────────────────────────────────────────

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { theme = "light", label, hint, error, className = "", children, ...props },
    ref,
  ) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className={`text-xs font-semibold ${labelClass[theme]}`}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`${inputCls(theme, !!error)} ${className} ${
          theme === "dark" ? "appearance-none" : ""
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="text-xs font-medium text-[#ff4757]">{error}</span>
      )}
      {!error && hint && (
        <span className={`text-xs ${labelClass[theme]}`}>{hint}</span>
      )}
    </div>
  ),
);
Select.displayName = "Select";
