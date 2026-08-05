import type { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
}

// CTA principal: gradiente naranja #F4977E→#EE8164 + sombra de color.
export function PrimaryButton({
  children,
  href = "#",
  icon,
  className = "",
}: PrimaryButtonProps) {
  return (
    <a
      href={href}
      className={`flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] ${className}`}
    >
      {icon}
      {children}
    </a>
  );
}
