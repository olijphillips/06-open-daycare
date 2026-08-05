import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

// Eyebrow uppercase: 12.5px, bold 800, letter-spacing 0.8px.
// El color lo define el consumidor vía className.
export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <span
      className={`text-[12.5px] font-extrabold uppercase tracking-[0.8px] ${className}`}
    >
      {children}
    </span>
  );
}
