"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { allergyTagMap, translateAllergiesToTags } from "@/lib/data/children";
import { createClient } from "@/utils/supabase/server";

export interface CreateChildInput {
  name: string;
  birthDate: string; // "dd/mm/aaaa"
  roomId: string; // uuid de la sala en BD
  allergies?: string; // "Maní, Lactosa" (etiquetas separadas por coma)
  medicalNotes?: string;
}

export interface CreateChildResult {
  ok: boolean;
  error?: string;
}

// Server Action que persiste un niño en `children` (SPEC 09).
// La validación vive en el servidor; la RLS deniega INSERT a un parent.
export async function createChild(
  input: CreateChildInput,
): Promise<CreateChildResult> {
  const supabase = createClient(await cookies());

  const name = input.name.trim();
  const [day, month, year] = input.birthDate.split("/").map(Number);
  if (!name) return { ok: false, error: "Ingresa el nombre" };
  if (!day || !month || !year || input.birthDate.length < 10) {
    return { ok: false, error: "Ingresa la fecha completa" };
  }

  // Alergias reconocidas → allergy_tags (inglés); las no reconocidas quedan
  // como texto libre en medical_notes.
  const allergyParts = (input.allergies ?? "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const tags = translateAllergiesToTags(input.allergies ?? "");
  const unknown = allergyParts.filter((part) => !allergyTagMap[part]);

  const notesParts = [input.medicalNotes?.trim()];
  if (unknown.length > 0) {
    notesParts.push(`Alergias no registradas: ${unknown.join(", ")}`);
  }
  const medicalNotes = notesParts.filter(Boolean).join("\n") || null;

  const { error } = await supabase.from("children").insert({
    room_id: input.roomId,
    full_name: name,
    birth_date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    allergy_tags: tags,
    medical_notes: medicalNotes,
  });

  if (error) {
    return { ok: false, error: "No se pudo guardar el niño." };
  }

  revalidatePath("/staff/kids");
  return { ok: true };
}
