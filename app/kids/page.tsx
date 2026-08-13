"use client";

import { useState } from "react";
import { KidCard } from "@/components/kids/kid-card";
import { AddChildModal } from "@/components/kids/add-child-modal";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { PrimaryButton } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import type { Child } from "@/lib/mock/children";
import { classrooms, children as mockChildren } from "@/lib/mock/children";

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
  // Los niños viven en estado local: el modal los agrega en memoria (SPEC 04).
  const [kids, setKids] = useState(mockChildren);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleSave(child: Child) {
    setKids((current) => [...current, child]);
    setIsModalOpen(false);
  }

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
          <PrimaryButton
            onClick={() => setIsModalOpen(true)}
            icon={<PlusIcon />}
            fullWidth={false}
          >
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

        {/* Secciones de sala: siempre las 3 (Sol, Tierra, Luna) */}
        {classrooms.map((room) => {
          const roomChildren = kids.filter((child) => child.classroom === room);
          return (
            <div key={room} className="mb-[22px]">
              <div className="mb-[14px] flex items-center gap-3">
                <SectionLabel className="text-ink">
                  SALA {room.toUpperCase()}
                </SectionLabel>
                <span className="text-[13px] text-[#A89A8B]">
                  {roomChildren.length} niños
                </span>
                <span className="h-px flex-1 bg-[#E7DAC8]" />
              </div>

              {roomChildren.length > 0 ? (
                <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                  {roomChildren.map((child) => (
                    <KidCard key={child.slug} child={child} />
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

      {isModalOpen && (
        <AddChildModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </AppShell>
  );
}
