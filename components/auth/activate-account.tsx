"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PrimaryButton } from "@/components/ui/button";
import { authDefaults } from "@/lib/mock/invitation";
import { activateAccount } from "@/lib/actions/activation";
import { createClient } from "@/utils/supabase/client";

interface InvitationPreview {
  childName: string;
  roomName: string;
}

// Pantalla de activación de cuenta tras la invitación de la guardería.
// Si llega un ?code= desde el correo, precarga la card de invitación con
// datos reales de BD (RPC validate_invitation) y valida en el cliente.
export function ActivateAccount({ code }: { code?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const [codeValue, setCodeValue] = useState(code ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Precarga la card de invitación cuando hay ?code= en la URL.
  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    (async () => {
      const { data, error: rpcError } = await supabase.rpc(
        "validate_invitation",
        { p_code: code },
      );
      if (cancelled) return;

      const row = Array.isArray(data) ? data[0] : undefined;
      if (rpcError || !row) {
        setCardError("Código inválido");
        return;
      }
      setInvitation({
        childName: (row as { child_name: string }).child_name,
        roomName: (row as { room_name: string }).room_name,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [code, supabase]);

  async function handleSubmit() {
    if (submitting) return;
    setError(null);
    setErrorCode(null);

    // Validación en cliente (espejo de la del servidor).
    if (!codeValue.trim()) {
      setError("Ingresa el código de invitación");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setErrorCode("password_too_short");
      return;
    }

    setSubmitting(true);
    const result = await activateAccount({ code: codeValue, email, password });

    if (!result.ok) {
      setError(result.error ?? "No se pudo activar la cuenta.");
      setErrorCode(result.errorCode ?? null);
      setSubmitting(false);
      return;
    }

    // Tras activar la cuenta quedó sesión activa → ir al panel familia.
    router.push("/familia");
    router.refresh();
  }

  const avatarInitial = invitation?.childName?.trim().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] px-10 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>

        <h1 className="font-display mb-[8px] text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        {invitation && (
          <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px]">
            <Avatar
              size={44}
              bg="#A9D9E8"
              color="#1F7A93"
              initial={avatarInitial}
              fontSize={19}
            />
            <div>
              <div className="text-[13px] text-muted">Te invitaron a seguir a</div>
              <div className="font-display text-[17px] font-semibold text-ink">
                {invitation.childName} · {invitation.roomName}
              </div>
            </div>
          </div>
        )}
        {cardError && (
          <div className="mb-[22px] rounded-[16px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-[14px] text-[14px] font-bold text-[#C5503A]">
            {cardError}
          </div>
        )}

        <div className="mb-[8px] text-[12px] font-bold uppercase tracking-[0.7px] text-muted">
          Código de invitación
        </div>
        <input
          value={codeValue}
          onChange={(e) => setCodeValue(e.target.value)}
          className="font-display mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[18px] font-bold tracking-[3px] text-ink"
        />

        <div className="mb-[8px] text-[12px] font-bold uppercase tracking-[0.7px] text-muted">
          Email
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-ink"
        />

        <div className="mb-[8px] text-[12px] font-bold uppercase tracking-[0.7px] text-muted">
          Crear contraseña
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={authDefaults.loginPasswordPlaceholder}
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-[14px] text-[15px] text-ink"
        />

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-[14px]">
          <span className="mt-[1px] flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#5FB97E]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-[14px] leading-[1.45] text-[#8A7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
          </span>
        </label>

        {error && (
          <p className="mb-4 text-center text-[14px] font-bold text-[#C5503A]">
            {error}{" "}
            {errorCode === "email_exists" && (
              <Link href="/login" className="underline">
                Iniciá sesión
              </Link>
            )}
          </p>
        )}

        <PrimaryButton className="rounded-[15px] py-[15px] text-base" onClick={handleSubmit}>
          {submitting ? "Activando…" : "Activar mi cuenta"}
        </PrimaryButton>

        <p className="mt-[22px] text-center text-[14.5px] text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-[#C5503A]">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
