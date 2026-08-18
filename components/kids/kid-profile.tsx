import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { ChildView } from "@/lib/data/children";

function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

// Perfil completo de un niño. Lo usa /kids/[id].
export function KidProfile({ child }: { child: ChildView }) {
  return (
    <div className="mx-auto max-w-[820px] px-5 pb-20 pt-16 md:px-10 md:pt-[34px]">
      {/* Volver a Niños */}
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-muted"
      >
        <ChevronLeftIcon />
        Volver a Niños
      </Link>

      <div className="flex flex-wrap items-start gap-[26px]">
        {/* Columna izquierda */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
          {/* Cabecera */}
          <div className="flex items-center gap-[18px]">
            <Avatar
              size={84}
              bg={child.avatarBg}
              color={child.avatarColor}
              initial={child.initial}
            />
            <div className="min-w-0 flex-1">
              <h1 className="m-0 font-display text-[28px] font-semibold text-ink">
                {child.name}
              </h1>
              <p className="m-0 mt-[3px] text-[15px] text-muted">
                {child.age} años · Sala {child.classroom}
              </p>
            </div>
            <a
              href="#"
              className="flex-none rounded-[12px] border-[1.5px] border-border-warm bg-surface px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
            >
              Editar
            </a>
          </div>

          {/* Caja de alergias (solo si hay notas) */}
          {child.allergyNotes && (
            <div className="flex gap-[14px] rounded-[16px] bg-[#FBDAD6] p-[16px_18px]">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                <WarningIcon />
              </div>
              <div>
                <div className="mb-[2px] text-[15px] font-extrabold text-[#C5413A]">
                  Alergias y notas
                </div>
                <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
                  {child.allergyNotes}
                </div>
              </div>
            </div>
          )}

          {/* Tarjeta de datos */}
          <div className="overflow-hidden rounded-[16px] border border-border-warm bg-surface">
            <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
              <span className="text-[14.5px] text-muted">Fecha de nacimiento</span>
              <span className="text-[14.5px] font-extrabold text-ink">
                {child.birthDate}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
              <span className="text-[14.5px] text-muted">Sala</span>
              <span className="text-[14.5px] font-extrabold text-ink">
                {child.classroom}
              </span>
            </div>
            <div className="flex justify-between px-[18px] py-[15px]">
              <span className="text-[14.5px] text-muted">Ingreso</span>
              <span className="text-[14.5px] font-extrabold text-ink">
                {child.enrollmentDate}
              </span>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex w-[300px] flex-none flex-col gap-[14px]">
          {/* Resumen del día */}
          <a
            href="#"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-3 py-[13px] text-[15px] font-extrabold text-white"
          >
            <SunIcon />
            Resumen del día
          </a>
        </div>
      </div>
    </div>
  );
}
