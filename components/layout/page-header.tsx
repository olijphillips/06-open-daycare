import { SectionLabel } from "@/components/ui/section-label";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

// Encabezado de página: eyebrow + título (Fredoka) + subtítulo.
export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <SectionLabel className="mb-1 block text-accent">{eyebrow}</SectionLabel>
      <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
        {title}
      </h1>
      <p className="m-0 mt-[5px] text-[14.5px] text-muted">{subtitle}</p>
    </div>
  );
}
