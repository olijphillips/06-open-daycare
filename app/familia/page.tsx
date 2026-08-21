"use client";

import { PostCard } from "@/components/feed/post-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { feedPosts } from "@/lib/mock/feed";
import { useSessionUser } from "@/lib/auth/use-session";

export default function FamiliaFeedPage() {
  const user = useSessionUser();
  // Página protegida: el layout y el proxy garantizan sesión; este guard evita el crash si no la hay.
  if (!user) return null;
  return (
    <div className="mx-auto max-w-[720px] px-5 pb-20 pt-16 md:px-10 md:pt-[34px]">
      <PageHeader
        eyebrow="TU FAMILIA"
        title={`Hola, ${user.name.split(" ")[0]}`}
        subtitle="Así va el día de hoy"
      />

      <div className="mb-[14px] flex items-center gap-[14px]">
        <SectionLabel className="text-[#8A7C6D]">HOY · MARTES 17 JUN</SectionLabel>
        <span className="h-px flex-1 bg-[#E7DAC8]" />
      </div>

      <div className="flex flex-col gap-4">
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
