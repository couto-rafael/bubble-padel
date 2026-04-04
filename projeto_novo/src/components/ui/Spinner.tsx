import React from "react";

// ─── SPINNER ──────────────────────────────────────────────────────────────────

type SpinnerTheme = "dark" | "light";
type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  theme?: SpinnerTheme;
  size?: SpinnerSize;
  className?: string;
}

const spinnerSizes: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
};

export const Spinner: React.FC<SpinnerProps> = ({
  theme = "dark",
  size = "md",
  className = "",
}) => (
  <span
    className={[
      "inline-block rounded-full animate-spin",
      spinnerSizes[size],
      theme === "dark"
        ? "border-white/10 border-t-[#00e87a]"
        : "border-blue-600/15 border-t-blue-600",
      className,
    ].join(" ")}
  />
);

// ─── SKELETON ─────────────────────────────────────────────────────────────────

type SkeletonTheme = "dark" | "light";

interface SkeletonProps {
  theme?: SkeletonTheme;
  className?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  theme = "light",
  className = "",
  rounded = false,
}) => (
  <div
    className={[
      "animate-pulse",
      rounded ? "rounded-full" : "rounded-lg",
      theme === "dark"
        ? "bg-white/[0.06]"
        : "bg-gray-200",
      className,
    ].join(" ")}
  />
);

// ─── LOADING STATE helpers ────────────────────────────────────────────────────

interface LoadingStateProps {
  theme?: "dark" | "light";
  text?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  theme = "dark",
  text,
  className = "",
}) => (
  <div
    className={[
      "flex items-center justify-center gap-3 py-12",
      className,
    ].join(" ")}
  >
    <Spinner theme={theme} />
    {text && (
      <span
        className={[
          "text-[13px] font-medium",
          theme === "dark" ? "text-[#6b7a99]" : "text-gray-500",
        ].join(" ")}
      >
        {text}
      </span>
    )}
  </div>
);
