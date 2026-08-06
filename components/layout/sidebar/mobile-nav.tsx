"use client";

import { useState } from "react";
import { SidebarContent } from "./sidebar-content";

// Navegación mobile: botón hamburguesa + overlay + drawer con slide-in.
// Reutiliza exactamente el contenido del sidebar desktop.
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-border-warm bg-surface text-ink shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)] md:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      >
        {/* Overlay */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Drawer */}
        <aside
          onClick={(e) => {
            // Cierre al clickar un enlace del sidebar.
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className={`absolute inset-y-0 left-0 flex w-62 flex-col border-r border-border-warm bg-surface px-4 py-6 transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent />
        </aside>
      </div>
    </>
  );
}
