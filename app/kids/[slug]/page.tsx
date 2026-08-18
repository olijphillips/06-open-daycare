import { notFound } from "next/navigation";
import { KidProfile } from "@/components/kids/kid-profile";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { getChildBySlug } from "@/lib/mock/children";

// Ruta dinámica: al leer cookies en el layout raíz, se renderiza por request
// (ya no se prerenderiza estática como en SPEC 02).

export default async function KidsProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const child = getChildBySlug(slug);
  if (!child) notFound();

  return (
    <AppShell
      sidebar={
        <>
          <Sidebar activeItem="Niños" />
          <MobileNav activeItem="Niños" />
        </>
      }
    >
      <KidProfile child={child} />
    </AppShell>
  );
}
