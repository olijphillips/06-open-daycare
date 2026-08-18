// Capa de datos de niños: mapeo BD → UI (SPEC 09).
// Valores persistidos en inglés (convención DB), etiquetas visibles en español.
// ChildView reemplaza al Child del mock en el listado /kids y el perfil /kids/[id];
// el mock de children se conserva solo para el compositor de posts y los parents.

import { cookies } from "next/headers";
import { avatarColorFor } from "@/lib/auth/profile";
import { createClient } from "@/utils/supabase/server";

export interface RoomView {
  id: string; // uuid de BD
  name: string; // "Sol"
}

export interface ChildTag {
  label: string; // "MANÍ" | "LACTOSA" | …
  bg: string;
  text: string;
}

export interface ChildView {
  id: string; // uuid de BD — clave del perfil
  name: string; // "Mateo Fernández"
  age: number; // 3
  avatarBg: string; // derivado por hash del nombre
  avatarColor: string;
  initial: string; // "M"
  parentsCount: number; // 0 (no hay parent_children aún)
  tag?: ChildTag; // solo alergias (MANÍ, LACTOSA…)
  birthDate: string; // "12 mar 2022"
  classroom: string; // "Sol"
  enrollmentDate: string; // "feb 2025"
  allergyNotes?: string; // medical_notes
}

// Fila de la tabla `children` tal como la devuelve Supabase.
export interface ChildRow {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string; // ISO "YYYY-MM-DD"
  enrolled_at: string; // ISO "YYYY-MM-DD"
  medical_notes: string | null;
  allergy_tags: string[] | null;
  photo_consent: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// Traducción de alergias. Valores persistidos en inglés (convención DB),
// etiquetas visibles en español.
export const allergyTagMap: Record<string, string> = {
  maní: "peanut",
  cacahuate: "peanut",
  lactosa: "lactose",
  leche: "dairy",
  gluten: "gluten",
  huevo: "egg",
  pescado: "fish",
  mariscos: "shellfish",
  soja: "soy",
  "frutos secos": "nuts",
};

export const allergyLabelMap: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  dairy: "LECHE",
  gluten: "GLUTEN",
  egg: "HUEVO",
  fish: "PESCADO",
  shellfish: "MARISCOS",
  soy: "SOJA",
  nuts: "FRUTOS SECOS",
};

// "Maní, Lactosa" → ["peanut", "lactose"]. Lo no reconocido se descarta del
// array y se deja constancia en medical_notes (texto libre).
export function translateAllergiesToTags(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => allergyTagMap[part])
    .filter((tag): tag is string => Boolean(tag));
}

// Color de avatar determinista por nombre: el bg sale de la misma paleta que
// lib/auth/profile.ts (avatarColorFor) y el texto de una tinta que lo acompaña.
const avatarTextByBg: Record<string, string> = {
  "#C9B6E8": "#7B5FC0",
  "#A9C7E8": "#4E72C8",
  "#F2937A": "#B5442A",
  "#A9D9E8": "#1F7A93",
  "#CCD8F4": "#4E72C8",
  "#F9D2DE": "#C56486",
  "#CFEBD8": "#3E8B62",
};

function avatarPairFor(name: string): { bg: string; text: string } {
  const bg = avatarColorFor(name);
  return { bg, text: avatarTextByBg[bg] ?? "#4E72C8" };
}

// Meses en español corto para birthDate / enrollmentDate (formato del mock).
const shortMonths = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// "2022-03-12" → "12 mar 2022"
function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${shortMonths[month - 1]} ${year}`;
}

// "2025-02-01" → "feb 2025"
function formatMonthYear(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  if (!year || !month) return iso;
  return `${shortMonths[month - 1]} ${year}`;
}

// Edad en años desde una fecha ISO.
function ageFromIsoDate(iso: string): number {
  const birth = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

// Mapea una fila de `children` + el nombre de su sala a una ChildView de UI.
export function buildChildView(row: ChildRow, roomName: string): ChildView {
  const { bg, text } = avatarPairFor(row.full_name);
  const tags = row.allergy_tags ?? [];
  return {
    id: row.id,
    name: row.full_name,
    age: ageFromIsoDate(row.birth_date),
    avatarBg: bg,
    avatarColor: text,
    initial: row.full_name.trim().charAt(0).toUpperCase() || "?",
    parentsCount: 0,
    ...(tags.length > 0
      ? {
          tag: {
            label: tags.map((tag) => allergyLabelMap[tag] ?? tag).join(", "),
            bg: "#FBD8CC",
            text: "#D9684A",
          },
        }
      : {}),
    birthDate: formatShortDate(row.birth_date),
    classroom: roomName,
    enrollmentDate: formatMonthYear(row.enrolled_at),
    ...(row.medical_notes ? { allergyNotes: row.medical_notes } : {}),
  };
}

// Lee un niño por id desde la BD (para /kids/[id]). Devuelve null si no existe.
export async function fetchChildById(id: string): Promise<ChildView | null> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const { data: room } = await supabase
    .from("rooms")
    .select("name")
    .eq("id", data.room_id)
    .maybeSingle();

  return buildChildView(data as ChildRow, room?.name ?? "");
}
