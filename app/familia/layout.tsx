import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { requirePanel } from "@/lib/auth/role-gate";

// Layout del panel familia: gate de rol (parent) + shell con sidebar.
// Un miembro del staff que intente entrar aquí es redirigido al panel staff.
export default async function FamiliaLayout({ children }: { children: ReactNode }) {
  await requirePanel(["parent"], "/staff");
  return (
    <AppShell sidebar={<><Sidebar /><MobileNav /></>}>
      {children}
    </AppShell>
  );
}
