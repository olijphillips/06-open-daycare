import { cookies } from "next/headers";
import { KidCard } from "@/components/kids/kid-card";
import { AddChildModal } from "@/components/kids/add-child-modal";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { SectionLabel } from "@/components/ui/section-label";
import { buildChildView } from "@/lib/data/children";
import type { ChildRow, ChildView, RoomView } from "@/lib/data/children";
import { createClient } from "@/utils/supabase/server";

// Orden de presentación de las salas (consistente con la UI del SPEC 04).
// Las salas vienen de la BD; este orden fijo mantiene "Sol, Tierra, Luna".
const roomDisplayOrder = ["Sol", "Tierra", "Luna"];

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

export default async function KidsPage() {
  const supabase = createClient(await cookies());

  const [{ data: rooms }, { data: rows }] = await Promise.all([
    supabase.from("rooms").select("id, name"),
    supabase.from("children").select("*").order("full_name"),
  ]);

  // Salas ordenadas según el orden de presentación (Sol, Tierra, Luna).
  const roomViews: RoomView[] = (rooms ?? [])
    .map((room) => ({ id: room.id, name: room.name }))
    .sort((a, b) => {
      const ia = roomDisplayOrder.indexOf(a.name);
      const ib = roomDisplayOrder.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
    });

  const roomNameById = new Map(roomViews.map((room) => [room.id, room.name]));
  const kids: ChildView[] = (rows ?? []).map((row) =>
    buildChildView(row as ChildRow, roomNameById.get(row.room_id) ?? ""),
  );

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
          <AddChildModal rooms={roomViews} />
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

        {/* Secciones de sala: las que existan en la BD */}
        {roomViews.map((room) => {
          const roomChildren = kids.filter((child) => child.classroom === room.name);
          return (
            <div key={room.id} className="mb-[22px]">
              <div className="mb-[14px] flex items-center gap-3">
                <SectionLabel className="text-ink">
                  SALA {room.name.toUpperCase()}
                </SectionLabel>
                <span className="text-[13px] text-[#A89A8B]">
                  {roomChildren.length} niños
                </span>
                <span className="h-px flex-1 bg-[#E7DAC8]" />
              </div>

              {roomChildren.length > 0 ? (
                <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                  {roomChildren.map((child) => (
                    <KidCard key={child.id} child={child} />
                  ))}
                </div>
              ) : (
                <p className="rounded-[14px] border border-dashed border-[#E7DAC8] px-4 py-5 text-[13.5px] text-[#A89A8B]">
                  Sin niños en esta sala todavía.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
