import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PrimaryButton } from "@/components/ui/button";
import { classroom, currentUser } from "@/lib/mock/feed";

// Íconos inline del mockup del sidebar.
function SunIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
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
function HomeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function ChildrenIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export type NavLabel = "Feed" | "Niños" | "Avisos" | "Mi cuenta";

const navItems = [
  { label: "Feed", href: "/", icon: <HomeIcon /> },
  { label: "Niños", href: "/kids", icon: <ChildrenIcon /> },
  { label: "Avisos", href: "#", icon: <BellIcon /> },
  { label: "Mi cuenta", href: "#", icon: <UserIcon /> },
];

// Contenido del sidebar (variante Maestra). Se reutiliza en desktop y drawer mobile.
// activeItem marca el ítem de nav activo (default "Feed" para no romper la home).
export function SidebarContent({
  activeItem = "Feed",
}: {
  activeItem?: NavLabel;
}) {
  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <SunIcon />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </div>
          <div className="mt-[2px] text-[11.5px] text-[#A89A8B]">
            Sala {classroom.name}
          </div>
        </div>
      </Link>

      {/* CTA Nueva publicación */}
      <PrimaryButton
        href="/crear-publicacion"
        icon={<PlusIcon />}
        className="mb-[18px]"
      >
        Nueva publicación
      </PrimaryButton>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const className = `flex items-center gap-3 rounded-[12px] px-3 py-[11px] text-[14.5px] ${
            item.label === activeItem
              ? "bg-primary-soft font-extrabold text-accent"
              : "font-semibold text-[#6E6359]"
          }`;
          return item.href.startsWith("/") ? (
            <Link key={item.label} href={item.href} className={className}>
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <a key={item.label} href={item.href} className={className}>
              {item.icon}
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Tarjeta de usuario + logout */}
      <div className="mt-[10px] border-t border-border-warm pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-[6px]">
          <Avatar
            size={38}
            bg={currentUser.avatarBg}
            color="#fff"
            initial={currentUser.initial}
            fontSize={16}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold text-ink">
              {currentUser.name}
            </div>
            <div className="text-[12px] text-[#A89A8B]">{currentUser.role}</div>
          </div>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-muted"
          >
            <LogoutIcon />
          </a>
        </div>
      </div>
    </>
  );
}
