"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { SectionLabel } from "@/components/ui/section-label";
import { LinkParentModal } from "@/components/kids/link-parent-modal";
import { relationshipLabels, type ParentView } from "@/lib/data/invitation-labels";

// Config de estado del padre: pill + texto de la meta.
const parentStatusConfig: Record<
  ParentView["status"],
  { label: string; bg: string; text: string; meta: string }
> = {
  active: { label: "ACTIVA", bg: "#CFEBD8", text: "#3E9B6C", meta: "activa" },
  pending: {
    label: "PENDIENTE",
    bg: "#F7E7A6",
    text: "#9A7B1E",
    meta: "invitación enviada",
  },
};

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Fila de un padre vinculado (pendiente o activo) desde la BD.
function ParentRow({ parent }: { parent: ParentView }) {
  const config = parentStatusConfig[parent.status];
  return (
    <div className="flex items-center gap-3">
      <Avatar size={40} bg={parent.avatarBg} color="#fff" initial={parent.initial} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-ink">{parent.name}</div>
        <div className="text-[12.5px] text-[#A89A8B]">
          {relationshipLabels[parent.relationship]} · {config.meta}
        </div>
      </div>
      <span
        className="flex-none rounded-full px-[9px] py-[4px] text-[10.5px] font-extrabold"
        style={{ background: config.bg, color: config.text }}
      >
        {config.label}
      </span>
    </div>
  );
}

interface LinkedParentsCardProps {
  childId: string; // uuid del niño en BD
  childName: string; // "Mateo Fernández"
  parents: ParentView[]; // invitaciones pendientes + padres activos (desde BD)
}

// Tarjeta "PADRES VINCULADOS" del perfil del niño (SPEC 10).
// La lista llega desde el server (fetchLinkedParents) y, tras enviar una
// invitación, router.refresh() la recarga desde la BD.
export function LinkedParentsCard({
  childId,
  childName,
  parents,
}: LinkedParentsCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="rounded-[16px] border border-border-warm bg-surface p-[16px_18px]">
      <SectionLabel className="mb-[14px] block text-[#8A7C6D]">
        PADRES VINCULADOS
      </SectionLabel>
      <div className="flex flex-col gap-[14px]">
        {parents.map((parent) => (
          <ParentRow key={parent.id} parent={parent} />
        ))}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex cursor-pointer items-center gap-3 pt-2 text-left"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
            <PlusIcon />
          </span>
          <span className="text-[14.5px] font-extrabold text-[#C5503A]">
            Vincular otro padre
          </span>
        </button>
      </div>

      {isModalOpen && (
        <LinkParentModal
          childId={childId}
          childName={childName}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            // Recarga la lista del server para que el pendiente aparezca.
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
