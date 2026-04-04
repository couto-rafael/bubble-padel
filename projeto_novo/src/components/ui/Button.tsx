import React from "react";

type Variant =
  | "primary-dark"
  | "secondary-dark"
  | "ghost-dark"
  | "danger-dark"
  | "cyan-dark"
  | "primary-light"
  | "secondary-light"
  | "ghost-light"
  | "success-light"
  | "danger-light";

type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  "primary-dark":
    "bg-[#00e87a] text-[#0a0e1a] hover:bg-[#00ff88] hover:shadow-[0_0_20px_rgba(0,232,122,0.3)] active:scale-[0.97]",
  "secondary-dark":
    "bg-white/[0.08] text-[#f0f4ff] border border-white/[0.12] hover:bg-white/[0.12] active:scale-[0.97]",
  "ghost-dark":
    "bg-transparent text-[#6b7a99] border border-white/[0.08] hover:text-[#f0f4ff] hover:bg-white/[0.04] active:scale-[0.97]",
  "danger-dark":
    "bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/25 hover:bg-[#ff4757]/15 active:scale-[0.97]",
  "cyan-dark":
    "bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/20 hover:bg-[#00c8ff]/15 active:scale-[0.97]",
  "primary-light":
    "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:bg-blue-700 hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)] active:scale-[0.97]",
  "secondary-light":
    "bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.97]",
  "ghost-light":
    "bg-transparent text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.97]",
  "success-light":
    "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 active:scale-[0.97]",
  "danger-light":
    "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-[0.97]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-[13px] rounded-lg",
  md: "px-5 py-2.5 text-[14px] rounded-xl",
  lg: "px-7 py-3.5 text-[15px] rounded-xl",
};

const Spinner = ({ dark }: { dark?: boolean }) => (
  <span
    className={`inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin ${
      dark
        ? "border-[#0a0e1a]/20 border-t-[#0a0e1a]"
        : "border-white/20 border-t-white"
    }`}
  />
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary-dark",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const isLight = variant.endsWith("light");

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2 font-bold transition-all duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading && <Spinner dark={variant === "primary-dark" || isLight} />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
