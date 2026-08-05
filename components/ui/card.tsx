import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

// Contenedor de tarjeta: superficie #FFFDF9 + borde cálido + sombra suave.
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[20px] border border-border-warm bg-surface shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)] ${className}`}
    >
      {children}
    </div>
  );
}
