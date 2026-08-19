// Etiquetas y tipos de UI de invitaciones/padres (SPEC 10).
// Módulo client-safe: no importa next/headers, lo consumen tanto los
// componentes cliente como la capa de datos del servidor.

export type Relationship = "father" | "mother" | "guardian";

// Fila de UI de la lista de padres vinculados de un niño.
export interface ParentView {
  id: string; // invitation id (pending) o parent_children id (active) — key de React
  name: string; // full_name del padre
  relationship: Relationship;
  status: "pending" | "active";
  initial: string; // primera letra del nombre
  avatarBg: string; // Mamá → #C9B6E8, Papá → #A9C7E8 (paleta del mock)
  email?: string; // solo pendientes (invitations.email)
  expiresInDays?: number; // 7 — solo pendientes
}

// Traducción UI del parentesco (valores BD en inglés, etiquetas en español).
export const relationshipLabels: Record<Relationship, string> = {
  father: "Papá",
  mother: "Mamá",
  guardian: "Tutor/a",
};

// Color de avatar por parentesco, manteniendo la paleta del mock.
export const avatarBgByRelationship: Record<Relationship, string> = {
  mother: "#C9B6E8",
  father: "#A9C7E8",
  guardian: "#CCD8F4",
};
