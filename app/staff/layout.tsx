import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { requirePanel } from "@/lib/auth/role-gate";

// Layout del panel staff: gate de rol (staff/admin) + shell con sidebar.
// Un parent que intente entrar aquí es redirigido al panel familia.
export default async function StaffLayout({ children }: { children: ReactNode }) {
  await requirePanel(["staff", "admin"], "/familia");
  return (
    <AppShell sidebar={<><Sidebar /><MobileNav /></>}>
      {children}
    </AppShell>
  );
}
