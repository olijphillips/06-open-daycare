// Placeholder de foto: caja dashed + ícono + caption (post de actividad).
export function PhotoPlaceholder({
  caption,
  href = "#",
}: {
  caption: string;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
      </svg>
      <span className="text-[13.5px]">{caption}</span>
    </a>
  );
}
