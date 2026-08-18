import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { ChildView } from "@/lib/data/children";

// Etiqueta de padres vinculados para la meta de la tarjeta.
function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

// Chevron ">" que se muestra cuando el niño no tiene tag.
function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// Tarjeta de niño del listado /kids. Toda la tarjeta es un enlace al perfil por id.
export function KidCard({ child }: { child: ChildView }) {
  return (
    <Link href={`/kids/${child.id}`} className="block">
      <Card className="flex min-w-0 items-center gap-[14px] p-4 transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]">
        <Avatar
          size={48}
          bg={child.avatarBg}
          color={child.avatarColor}
          initial={child.initial}
        />
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16px] font-semibold text-ink">
            {child.name}
          </div>
          <div className="text-[13px] text-[#A89A8B]">
            {child.age} años · {parentsLabel(child.parentsCount)}
          </div>
        </div>
        {child.tag ? (
          <span
            className="flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold"
            style={{ background: child.tag.bg, color: child.tag.text }}
          >
            {child.tag.label}
          </span>
        ) : (
          <ChevronIcon />
        )}
      </Card>
    </Link>
  );
}
