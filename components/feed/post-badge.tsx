import { badgeConfig, type PostType } from "@/lib/mock/feed";

// Pill de tipo de publicación: dot + label, colores según badgeConfig.
export function PostBadge({ type }: { type: PostType }) {
  const config = badgeConfig[type];
  return (
    <div
      className="flex items-center gap-[7px] rounded-full px-3 py-[6px]"
      style={{ background: config.bg }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: config.dot }}
      />
      <span
        className="text-[12px] font-extrabold tracking-[0.5px]"
        style={{ color: config.text }}
      >
        {config.label}
      </span>
    </div>
  );
}
