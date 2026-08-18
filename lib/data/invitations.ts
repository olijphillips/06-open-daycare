// Capa de datos de invitaciones y vínculos padre-niño (SPEC 10).
// Módulo de servidor: usa cookies/RLS. Los tipos y etiquetas compartidas con
// el cliente viven en lib/data/invitation-labels.ts (client-safe).

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  avatarBgByRelationship,
  type ParentView,
} from "@/lib/data/invitation-labels";

export type { Relationship, ParentView } from "@/lib/data/invitation-labels";
export { relationshipLabels } from "@/lib/data/invitation-labels";

// Primera letra del nombre para el avatar.
function initialFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// Días que faltan para que expire una invitación (redondeando hacia arriba).
function daysUntil(expiresAt: string): number {
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return 7;
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86_400_000));
}

// Invitaciones pendientes (status pending) + padres activos (parent_children
// join users) de un niño. Pendientes primero, cada grupo por created_at.
export async function fetchLinkedParents(childId: string): Promise<ParentView[]> {
  const supabase = createClient(await cookies());

  const [invitationsRes, parentsRes] = await Promise.all([
    supabase
      .from("invitations")
      .select("id, full_name, email, relationship, expires_at, created_at")
      .eq("child_id", childId)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("parent_children")
      .select("id, relationship, created_at, users(full_name)")
      .eq("child_id", childId)
      .order("created_at", { ascending: true }),
  ]);

  const pending: ParentView[] = (invitationsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.full_name,
    relationship: row.relationship as ParentView["relationship"],
    status: "pending",
    initial: initialFor(row.full_name),
    avatarBg: avatarBgByRelationship[row.relationship as ParentView["relationship"]] ?? "#CCD8F4",
    email: row.email,
    expiresInDays: daysUntil(row.expires_at),
  }));

  const active: ParentView[] = (parentsRes.data ?? [])
    .map((row): ParentView | null => {
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      const name =
        typeof user === "object" && user !== null
          ? (user as { full_name?: string }).full_name ?? ""
          : "";
      if (!name) return null;
      const relationship = row.relationship as ParentView["relationship"];
      return {
        id: row.id,
        name,
        relationship,
        status: "active",
        initial: initialFor(name),
        avatarBg: avatarBgByRelationship[relationship] ?? "#CCD8F4",
      };
    })
    .filter((view): view is ParentView => Boolean(view));

  return [...pending, ...active];
}
