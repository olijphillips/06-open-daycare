import { notFound } from "next/navigation";
import { KidProfile } from "@/components/kids/kid-profile";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { children, getChildBySlug } from "@/lib/mock/children";

// Prerenderiza una página de perfil por cada niño en build time.
export function generateStaticParams() {
  return children.map((child) => ({ slug: child.slug }));
}

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
