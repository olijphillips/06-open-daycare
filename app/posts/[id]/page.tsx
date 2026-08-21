import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { getRole } from "@/lib/auth/role-gate";

// Detalle de publicación compartido entre paneles. El sidebar se adapta al
// rol del usuario autenticado; sin sesión el proxy redirige a /login.
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await getRole();
  if (!role) redirect("/login");

  return (
    <AppShell sidebar={<><Sidebar /><MobileNav /></>}>
      <PlaceholderPage title={`Publicación · ${id}`} />
    </AppShell>
  );
}
