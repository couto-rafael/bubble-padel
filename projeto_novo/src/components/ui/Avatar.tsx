import React from "react";

type AvatarSize = "sm" | "md" | "lg" | "xl";
type AvatarColor = "green" | "cyan" | "orange" | "blue" | "green-alt" | "neutral-dark" | "neutral-light";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  color?: AvatarColor;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-[13px]",
  lg: "w-11 h-11 text-[15px]",
  xl: "w-14 h-14 text-[19px]",
};

const colorClasses: Record<AvatarColor, string> = {
  "green":         "bg-gradient-to-br from-[#00e87a] to-[#00b85f] text-[#0a0e1a]",
  "cyan":          "bg-gradient-to-br from-[#00c8ff] to-[#007db8] text-[#0a0e1a]",
  "orange":        "bg-gradient-to-br from-[#ff6b35] to-[#c43800] text-white",
  "blue":          "bg-gradient-to-br from-blue-500 to-blue-700 text-white",
  "green-alt":     "bg-gradient-to-br from-green-500 to-green-800 text-white",
  "neutral-dark":  "bg-white/[0.08] text-[#6b7a99]",
  "neutral-light": "bg-gray-100 text-gray-500 border border-gray-200",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name = "",
  src,
  size = "md",
  color = "neutral-light",
  className = "",
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={[
          "rounded-full object-cover flex-shrink-0",
          sizeClasses[size],
          className,
        ].join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "rounded-full flex items-center justify-center flex-shrink-0 font-extrabold",
        sizeClasses[size],
        colorClasses[color],
        className,
      ].join(" ")}
    >
      {name ? getInitials(name) : "?"}
    </div>
  );
};
