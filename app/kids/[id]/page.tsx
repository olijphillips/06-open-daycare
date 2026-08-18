import { notFound } from "next/navigation";
import { KidProfile } from "@/components/kids/kid-profile";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { fetchChildById } from "@/lib/data/children";
import { fetchLinkedParents } from "@/lib/data/invitations";

// Ruta dinámica: al leer cookies en el layout raíz, se renderiza por request
// (ya no se prerenderiza estática como en SPEC 02).

export default async function KidsProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const child = await fetchChildById(id);
  if (!child) notFound();

  const parents = await fetchLinkedParents(id);

  return (
    <AppShell
      sidebar={
        <>
          <Sidebar activeItem="Niños" />
          <MobileNav activeItem="Niños" />
        </>
      }
    >
      <KidProfile child={child} parents={parents} />
    </AppShell>
  );
}
