import { KidCard } from "@/components/kids/kid-card";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { PrimaryButton } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { children } from "@/lib/mock/children";
import { classroom } from "@/lib/mock/feed";

// Icono "+" del CTA "Agregar niño".
function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Icono de búsqueda del buscador.
function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function KidsPage() {
  return (
    <AppShell
      sidebar={
        <>
          <Sidebar activeItem="Niños" />
          <MobileNav activeItem="Niños" />
        </>
      }
    >
      <div className="mx-auto max-w-[880px] px-5 pb-20 pt-16 md:px-10 md:pt-[34px]">
        {/* Header */}
        <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel className="mb-1 block text-accent">GESTIÓN</SectionLabel>
            <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
              Niños
            </h1>
          </div>
          <PrimaryButton href="#" icon={<PlusIcon />} fullWidth={false}>
            Agregar niño
          </PrimaryButton>
        </div>

        {/* Buscador (solo visual) */}
        <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-border-warm bg-surface px-4 py-3">
          <SearchIcon />
          <input
            type="text"
            aria-label="Buscar niño"
            placeholder="Buscar niño…"
            className="flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
          />
        </div>

        {/* Separador de sala */}
        <div className="mb-[14px] flex items-center gap-3">
          <SectionLabel className="text-ink">
            SALA {classroom.name.toUpperCase()}
          </SectionLabel>
          <span className="text-[13px] text-[#A89A8B]">
            {children.length} niños
          </span>
          <span className="h-px flex-1 bg-[#E7DAC8]" />
        </div>

        {/* Grid de niños */}
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          {children.map((child) => (
            <KidCard key={child.slug} child={child} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
