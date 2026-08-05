import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { FeedPost } from "@/lib/mock/feed";
import { PhotoPlaceholder } from "./photo-placeholder";
import { PostActions } from "./post-actions";
import { PostBadge } from "./post-badge";

// Ícono megáfono para posts de tipo anuncio (sin inicial).
function MegaphoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

// Tarjeta de publicación: avatar/ícono + nombre + hora + badge + destinatario + texto + foto + acciones.
export function PostCard({ post }: { post: FeedPost }) {
  return (
    <Card className="px-[22px] py-5">
      {/* Encabezado */}
      <div className="mb-[14px] flex items-center gap-3">
        <Avatar
          size={44}
          bg={post.avatarBg}
          color={post.avatarColor}
          initial={post.authorInitial}
          icon={post.authorInitial ? undefined : <MegaphoneIcon />}
          fontSize={17}
        />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.authorName}
          </div>
          <div className="text-[12.5px] text-[#A89A8B]">
            {post.time} · {post.publishedBy}
          </div>
        </div>
        <PostBadge type={post.type} />
      </div>

      {/* Destinatario */}
      <div className="mb-[10px] text-[12.5px] text-[#A89A8B]">{post.audience}</div>

      {/* Texto */}
      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">{post.text}</p>

      {/* Foto opcional */}
      {post.photo && <PhotoPlaceholder caption={post.photo.caption} />}

      {/* Acciones */}
      <PostActions likes={post.likes} comments={post.comments} />
    </Card>
  );
}
