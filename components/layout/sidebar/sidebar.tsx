import { SidebarContent, type NavLabel } from "./sidebar-content";

// Sidebar desktop: aside sticky de 248px, oculto en mobile.
export function Sidebar({ activeItem }: { activeItem?: NavLabel }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-border-warm bg-surface px-4 py-6 md:flex">
      <SidebarContent activeItem={activeItem} />
    </aside>
  );
}
