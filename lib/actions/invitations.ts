"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import { buildInvitationEmail } from "@/lib/emails/invitation";

export interface SendInvitationInput {
  childId: string; // uuid del niño en BD
  name: string;
  email: string;
  relationship: "father" | "mother"; // solo estos dos (decisión del usuario)
}

export interface SendInvitationResult {
  ok: boolean;
  error?: string;
  code?: string; // solo si ok — se muestra en el modal
  expiresAt?: string; // ISO — para "Vence en 7 días"
}

// Remitente test de Resend (sin dominio verificado).
const FROM_EMAIL = "OpenDayCare <onboarding@resend.dev>";
const EXPIRES_IN_DAYS = 7; // el mockup dice "Vence en 7 días"

// Alfabeto sin caracteres ambiguos (sin I, L, O, 0, 1).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const MAX_CODE_ATTEMPTS = 3;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

// Server Action que crea la invitación y envía el correo con Resend (SPEC 10).
// La validación y la autorización viven en el servidor; la RLS deniega el
// INSERT a un parent. Sin RESEND_API_KEY el correo se registra en consola y
// el flujo devuelve éxito (modo dev).
export async function sendInvitation(
  input: SendInvitationInput,
): Promise<SendInvitationResult> {
  const supabase = createClient(await cookies());

  const name = input.name.trim();
  const email = input.email.trim();

  if (!name) return { ok: false, error: "Ingresa el nombre del padre/madre" };
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Ingresa un email válido" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión venció. Volvé a iniciar sesión." };

  // Nombre del niño (primer nombre) para el correo.
  const { data: child } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", input.childId)
    .maybeSingle();
  const childFirstName = child?.full_name?.trim().split(" ")[0] ?? "";

  const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 86_400_000);

  let insertedId: string | null = null;

  // Reintenta ante colisión del código (UNIQUE en invitations.code).
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode();

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id: input.childId,
        invited_by: user.id,
        full_name: name,
        email,
        relationship: input.relationship,
        code,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505" && attempt < MAX_CODE_ATTEMPTS - 1) {
        continue; // código duplicado → generar otro
      }
      return { ok: false, error: "No se pudo crear la invitación." };
    }

    insertedId = data.id;
    const { ok, error: emailError } = await deliverEmail({
      parentName: name,
      childFirstName,
      email,
      code,
      expiresAt: expiresAt.toISOString(),
    });

    if (!ok) {
      // El correo no salió → se elimina la fila para no dejar invitaciones
      // huérfanas; la BD refleja lo que realmente se envió.
      await supabase.from("invitations").delete().eq("id", insertedId);
      return { ok: false, error: emailError ?? "No se pudo enviar el correo." };
    }

    revalidatePath("/kids");
    revalidatePath(`/kids/${input.childId}`);
    return { ok: true, code, expiresAt: expiresAt.toISOString() };
  }

  return { ok: false, error: "No se pudo generar un código de invitación." };
}

interface DeliverEmailInput {
  parentName: string;
  childFirstName: string;
  email: string;
  code: string;
  expiresAt: string;
}

// Envía el correo con Resend, o lo registra en consola si no hay API key.
async function deliverEmail(
  input: DeliverEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  const emailContent = buildInvitationEmail({
    parentName: input.parentName,
    childFirstName: input.childFirstName,
    code: input.code,
    expiresInDays: EXPIRES_IN_DAYS,
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[sendInvitation] Sin RESEND_API_KEY — correo registrado en consola:", {
      to: input.email,
      subject: emailContent.subject,
      code: input.code,
      expiresAt: input.expiresAt,
    });
    return { ok: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [input.email],
    subject: emailContent.subject,
    html: emailContent.html,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
