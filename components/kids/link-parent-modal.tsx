"use client";

import { useState, type FormEvent } from "react";
import { sendInvitation, type SendInvitationResult } from "@/lib/actions/invitations";

interface LinkParentModalProps {
  childId: string; // uuid del niño en BD
  childName: string; // "Mateo Fernández" — se muestra en el subtítulo y el banner
  onClose: () => void;
  onSuccess: (result: { code: string; expiresAt: string }) => void;
}

function CloseIcon() {
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
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4E72C8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

// Parentescos del modal. Solo Mamá/Papá (decisión del usuario, SPEC 05/10);
// los valores en inglés son los que persiste la BD.
type RelationshipOption = "father" | "mother";

const ROLES: Array<{ value: RelationshipOption; label: string }> = [
  { value: "mother", label: "Mamá" },
  { value: "father", label: "Papá" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Modal "Vincular padre" real (SPEC 10): valida, llama a la Server Action
// sendInvitation y, tras el éxito, muestra el código generado en el recuadro.
export function LinkParentModal({
  childId,
  childName,
  onClose,
  onSuccess,
}: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RelationshipOption>("mother");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendInvitationResult | null>(null);

  const firstName = childName.split(" ")[0];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("Ingresa el nombre del padre/madre");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Ingresa un email válido");
      return;
    }

    setSubmitting(true);
    const response = await sendInvitation({
      childId,
      name: trimmedName,
      email: trimmedEmail,
      relationship: role,
    });
    setSubmitting(false);

    if (!response.ok) {
      setError(response.error ?? "No se pudo enviar la invitación.");
      return;
    }

    setResult(response);
    onSuccess({ code: response.code ?? "", expiresAt: response.expiresAt ?? "" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.35)] px-6 py-10">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.45)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <div>
            <div className="font-display text-[18px] font-semibold text-ink">
              Vincular padre
            </div>
            <div className="text-[13px] text-[#A89A8B]">a {childName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-[26px] py-[22px]">
          {/* Banner de aviso */}
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] p-[13px_16px]">
            <InfoIcon />
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {firstName}.
            </span>
          </div>

          {result?.ok ? (
            /* Estado de éxito: código real generado por la Server Action */
            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#A88526]">
                Código de invitación
              </div>
              <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
                {result.code}
              </div>
              <div className="mt-[6px] text-[13px] text-[#A88526]">
                Se lo enviamos por correo a {email.trim()}. Vence en 7 días
              </div>
            </div>
          ) : (
            /* Estado de formulario */
            <>
              {/* Nombre */}
              <label
                htmlFor="parent-name"
                className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]"
              >
                Nombre del padre/madre
              </label>
              <input
                id="parent-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Diego Fernández"
                className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
              />

              {/* Email */}
              <label
                htmlFor="parent-email"
                className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]"
              >
                Email
              </label>
              <input
                id="parent-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
              />

              {/* Parentesco */}
              <div className="mb-5 text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]">
                Parentesco
              </div>
              <div className="mb-5 flex gap-[9px]">
                {ROLES.map((option) => {
                  const isActive = role === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`flex-1 rounded-full border-[1.5px] px-3 py-[11px] text-[14px] font-extrabold ${
                        isActive
                          ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                          : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Error inline */}
          {error && (
            <div className="mb-4 rounded-[12px] bg-[#FBDAD6] px-4 py-[11px] text-[13.5px] font-bold text-[#C5413A]">
              {error}
            </div>
          )}

          {/* CTA */}
          {result?.ok ? (
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
            >
              Listo
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <SendIcon />
              {submitting ? "Enviando…" : "Enviar invitación"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
