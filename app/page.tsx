import { ComposerTrigger } from "@/components/feed/composer-trigger";
import { PostCard } from "@/components/feed/post-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MobileNav } from "@/components/layout/sidebar/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { SectionLabel } from "@/components/ui/section-label";
import { classroom, currentUser, feedPosts } from "@/lib/mock/feed";

export default function Home() {
  return (
    <AppShell sidebar={<><Sidebar /><MobileNav /></>}>
      <div className="mx-auto max-w-[760px] px-5 pb-20 pt-16 md:px-10 md:pt-[34px]">
        <PageHeader
          eyebrow={`GUARDERÍA · SALA ${classroom.name.toUpperCase()}`}
          title={`Buenas, ${currentUser.name.split(" ")[0]}`}
          subtitle={`${classroom.childrenCount} niños · martes 17 jun`}
        />

        <ComposerTrigger />

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
    </AppShell>
  );
}
