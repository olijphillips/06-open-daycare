import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { currentUser } from "@/lib/mock/feed";

// Disparador del compositor: tarjeta "Compartí un momento…" con avatar + ícono cámara.
export function ComposerTrigger() {
  return (
    <Link
      href="/crear-publicacion"
      className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-border-warm bg-surface px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
    >
      <Avatar
        size={40}
        bg={currentUser.avatarBg}
        color="#fff"
        initial={currentUser.initial}
        fontSize={16}
      />
      <span className="flex-1 text-[15px] text-[#A89A8B]">Compartí un momento…</span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-primary-soft text-like">
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
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </span>
    </Link>
  );
}
