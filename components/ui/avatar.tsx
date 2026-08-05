import type { ReactNode } from "react";

interface AvatarProps {
  size: number;
  bg: string;
  color: string;
  initial?: string;
  icon?: ReactNode;
  fontSize?: number;
  className?: string;
}

// Avatar circular: muestra una inicial (Fredoka) o un ícono (ej. megáfono).
export function Avatar({
  size,
  bg,
  color,
  initial,
  icon,
  fontSize,
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color,
        fontSize: fontSize ?? Math.round(size * 0.4),
      }}
    >
      {initial ?? icon}
    </div>
  );
}
