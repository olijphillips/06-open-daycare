// Perfil del usuario autenticado para la UI.
// Fuente: tabla `users` + `daycares` (SPEC 07/06). Enums de BD en inglés,
// etiquetas visibles en español.

export interface SessionUser {
  name: string; // "Nadia García"
  role: UserRole; // "staff" | "parent" | "admin" — rol crudo (en inglés, convención DB)
  roleLabel: string; // "Admin · Soles" (etiqueta traducida + sala)
  initial: string; // "N"
  avatarBg: string; // color derivado de la paleta del mock
}

export type UserRole = "admin" | "staff" | "parent";

// Traducción UI de los enums de BD (los valores persistidos siguen en inglés).
export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Maestro",
  parent: "Familia",
};

// Paleta de avatares ya usada por el mock, para mantener la coherencia visual.
const avatarPalette = [
  "#C9B6E8",
  "#A9C7E8",
  "#F2937A",
  "#A9D9E8",
  "#CCD8F4",
  "#F9D2DE",
  "#CFEBD8",
];

// Color de avatar determinista por nombre (mismo nombre → mismo color).
export function avatarColorFor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return avatarPalette[hash % avatarPalette.length];
}

// Extrae el nombre de la sala de un daycare tipo "Guardería Sala Soles" → "Soles".
// Fallback a la sala por defecto del mock (classroom.name) si falta el daycare.
function salaName(daycareName: string | null): string {
  if (!daycareName) return "Soles";
  const words = daycareName.replace(/^Guardería\s+/, "").trim().split(/\s+/);
  return words[words.length - 1] || "Soles";
}

// Construye el SessionUser visible en la UI a partir de una fila de users + el daycare.
export function buildProfile(input: {
  fullName: string;
  role: UserRole;
  daycareName: string | null; // "Guardería Sala Soles"
}): SessionUser {
  const name = input.fullName.trim();
  return {
    name,
    role: input.role,
    roleLabel: `${roleLabels[input.role]} · ${salaName(input.daycareName)}`,
    initial: name.charAt(0).toUpperCase(),
    avatarBg: avatarColorFor(name),
  };
}
