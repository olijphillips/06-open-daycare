"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export interface ActivateAccountInput {
  code: string;
  email: string;
  password: string;
}

export interface ActivateAccountResult {
  ok: boolean;
  error?: string; // mensaje inline (español)
  errorCode?:
    | "invalid_code" // código inexistente / ya usado
    | "expired" // invitación vencida
    | "email_mismatch" // el email no coincide con la invitación
    | "email_exists" // ya hay una cuenta con ese email
    | "password_too_short"; // < 6 caracteres
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Server Action que activa la cuenta del padre con el código de invitación
// (SPEC 11): valida la invitación, crea el usuario en Supabase Auth con los
// metadatos que exige el trigger handle_new_user y acepta la invitación.
// La validación y la autorización viven en el servidor; las RPC SECURITY
// DEFINER acotan el vínculo a código + email.
export async function activateAccount(
  input: ActivateAccountInput,
): Promise<ActivateAccountResult> {
  const supabase = createClient(await cookies());

  const code = input.code.trim();
  const email = input.email.trim();

  if (!code) return { ok: false, error: "Ingresa el código de invitación" };
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Ingresa un email válido" };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 6 caracteres",
      errorCode: "password_too_short",
    };
  }

  // Valida la invitación contra la BD (código, vigencia y email).
  const { data: invitation, error: validationError } = await supabase.rpc(
    "validate_invitation",
    { p_code: code, p_email: email },
  );

  if (validationError || !Array.isArray(invitation) || invitation.length === 0) {
    return mapValidationError(validationError?.message ?? "");
  }

  const invite = invitation[0] as {
    full_name: string;
    daycare_id: string;
  };

  // Crea el usuario parent. Con "Confirm email" desactivado (dashboard), el
  // signup devuelve sesión activa al instante y el proxy deja pasar a "/".
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        role: "parent",
        full_name: invite.full_name,
        daycare_id: invite.daycare_id,
      },
    },
  });

  if (signUpError) {
    if (signUpError.code === "user_already_exists") {
      return {
        ok: false,
        error: "Ya existe una cuenta con este email. Iniciá sesión.",
        errorCode: "email_exists",
      };
    }
    return { ok: false, error: "No se pudo crear la cuenta." };
  }

  // Marca la invitación aceptada y crea el vínculo padre-niño.
  // La RPC valida que el email del JWT coincida con invitations.email.
  const { error: acceptError } = await supabase.rpc("accept_invitation", {
    p_code: code,
  });

  if (acceptError) {
    return mapValidationError(acceptError.message ?? "");
  }

  revalidatePath("/");
  redirect("/");
}

// Traduce los errores de las RPC a mensajes inline en español.
function mapValidationError(message: string): ActivateAccountResult {
  if (message.includes("EXPIRED_INVITATION")) {
    return {
      ok: false,
      error: "Esta invitación venció. Pedí a la guardería que la renueve.",
      errorCode: "expired",
    };
  }
  if (message.includes("EMAIL_MISMATCH")) {
    return {
      ok: false,
      error: "Este email no coincide con el de la invitación.",
      errorCode: "email_mismatch",
    };
  }
  return { ok: false, error: "Código inválido", errorCode: "invalid_code" };
}
