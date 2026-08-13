import Link from "next/link";
import type { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
  fullWidth?: boolean;
  onClick?: () => void;
}

// CTA principal: gradiente naranja #F4977E→#EE8164 + sombra de color.
// fullWidth (default true) para el sidebar; false para CTAs auto-width (ej. header de /kids).
// Si se pasa onClick renderiza un <button>; si no, un <Link>.
export function PrimaryButton({
  children,
  href = "#",
  icon,
  className = "",
  fullWidth = true,
  onClick,
}: PrimaryButtonProps) {
  const baseClassName = `${fullWidth ? "flex w-full" : "inline-flex"} items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClassName}>
        {icon}
        {children}
      </button>
    );
  }

  return (
    <Link href={href} className={baseClassName}>
      {icon}
      {children}
    </Link>
  );
}
