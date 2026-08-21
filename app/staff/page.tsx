"use client";

import { useSyncExternalStore } from "react";
import { ComposerTrigger } from "@/components/feed/composer-trigger";
import { PostCard } from "@/components/feed/post-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { Counter } from "@/components/ui/counter";
import { classroom, getInitialPosts, getPosts, subscribe } from "@/lib/mock/feed";
import { useSessionUser } from "@/lib/auth/use-session";

export default function StaffFeedPage() {
  // Feed en memoria (SPEC 05): se re-renderiza al publicar desde /staff/crear-publicacion.
  const feedPosts = useSyncExternalStore(subscribe, getPosts, getInitialPosts);
  const user = useSessionUser();
  // Página protegida: el layout y el proxy garantizan sesión; este guard evita el crash si no la hay.
  if (!user) return null;
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-20 pt-16 md:px-10 md:pt-[34px]">
      <PageHeader
        eyebrow={`GUARDERÍA · SALA ${classroom.name.toUpperCase()}`}
        title={`Buenas, ${user.name.split(" ")[0]}`}
        subtitle={`${classroom.childrenCount} niños · martes 17 jun`}
      />

      <ComposerTrigger />

      <Counter initialValue={0} className="mb-6" />

      <div className="mb-[14px] flex items-center gap-[14px]">
        <SectionLabel className="text-[#8A7C6D]">PUBLICADO HOY</SectionLabel>
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
