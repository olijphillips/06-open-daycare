"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/button";
import { createChild } from "@/lib/actions/children";
import type { RoomView } from "@/lib/data/children";

interface AddChildModalProps {
  rooms: RoomView[]; // salas desde la BD (SPEC 09)
}

interface ChildFormErrors {
  name?: string;
  birthDate?: string;
  server?: string;
}

// Aplica la máscara dd/mm/aaaa: inserta "/" mientras se escribe y acota a 10 chars.
function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// "dd/mm/aaaa" → ¿fecha plausible? El rango evita fechas absurdas (99/99/9999).
function isValidBirthDate(value: string): boolean {
  if (value.length < 10) return false;
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return false;
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

// Icono "+" del CTA "Agregar niño".
function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Modal "Agregar niño" con los 3 campos obligatorios del SPEC 04, que ahora
// persiste con la Server Action createChild (SPEC 09). Incluye el botón CTA
// que lo abre, por lo que /kids lo renderiza en el header.
export function AddChildModal({ rooms }: AddChildModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLFormElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [errors, setErrors] = useState<ChildFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Gestión de foco, scroll del body y cierre con Escape mientras el modal está abierto.
  useEffect(() => {
    if (!isOpen) return;

    const dialogNode = dialogRef.current;
    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogNode) return;

      const focusable = Array.from(
        dialogNode.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: Pick<ChildFormErrors, "name" | "birthDate"> = {};
    if (!name.trim()) nextErrors.name = "Ingresa el nombre";
    if (!isValidBirthDate(birthDate)) nextErrors.birthDate = "Ingresa la fecha completa";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const result = await createChild({
      name,
      birthDate,
      roomId,
      allergies,
      medicalNotes,
    });
    setSubmitting(false);
    if (!result.ok) {
      setErrors({ server: result.error ?? "No se pudo guardar el niño." });
      return;
    }
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <PrimaryButton onClick={() => setIsOpen(true)} icon={<PlusIcon />} fullWidth={false}>
        Agregar niño
      </PrimaryButton>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-child-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.35)] px-6 py-10"
        >
          <form
            ref={dialogRef}
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
            tabIndex={-1}
            className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.45)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[15px] font-bold text-[#94887B]"
              >
                Cancelar
              </button>
              <span
                id="add-child-title"
                className="font-display text-[18px] font-semibold text-ink"
              >
                Agregar niño
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="text-[15px] font-extrabold text-accent disabled:opacity-40"
              >
                {submitting ? "Guardando…" : "Guardar"}
              </button>
            </div>

            {/* Cuerpo */}
            <div className="px-[26px] py-6">
              {/* Error de servidor */}
              {errors.server && (
                <p
                  role="alert"
                  className="mb-[18px] rounded-[12px] bg-[#FBDAD6] px-4 py-3 text-[13px] font-bold text-[#C5413A]"
                >
                  {errors.server}
                </p>
              )}

              {/* Nombre */}
              <div>
                <label
                  htmlFor="child-name"
                  className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]"
                >
                  Nombre completo
                </label>
                <input
                  id="child-name"
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ej. Martina López"
                  className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "child-name-error" : undefined}
                />
                {errors.name && (
                  <p
                    id="child-name-error"
                    className="-mt-[12px] mb-[18px] text-[12.5px] font-bold text-[#D9583C]"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Fecha + Sala */}
              <div className="flex gap-[14px]">
                <div className="flex-1">
                  <label
                    htmlFor="child-birthdate"
                    className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]"
                  >
                    Fecha de nacimiento
                  </label>
                  <input
                    id="child-birthdate"
                    type="text"
                    inputMode="numeric"
                    value={birthDate}
                    onChange={(event) => setBirthDate(maskDate(event.target.value))}
                    placeholder="dd/mm/aaaa"
                    className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
                    aria-invalid={Boolean(errors.birthDate)}
                    aria-describedby={errors.birthDate ? "child-birthdate-error" : undefined}
                  />
                  {errors.birthDate && (
                    <p
                      id="child-birthdate-error"
                      className="-mt-[12px] mb-[18px] text-[12.5px] font-bold text-[#D9583C]"
                    >
                      {errors.birthDate}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="child-classroom"
                    className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]"
                  >
                    Sala
                  </label>
                  <select
                    id="child-classroom"
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] font-bold text-ink outline-none focus:border-primary"
                  >
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Alergias (opcional) */}
              <div>
                <label
                  htmlFor="child-allergies"
                  className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]"
                >
                  Alergias (etiquetas)
                </label>
                <input
                  id="child-allergies"
                  type="text"
                  value={allergies}
                  onChange={(event) => setAllergies(event.target.value)}
                  placeholder="Ej. Maní, Lactosa"
                  className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
                />
              </div>

              {/* Notas médicas (opcional) */}
              <div>
                <label
                  htmlFor="child-medical-notes"
                  className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]"
                >
                  Notas médicas
                </label>
                <textarea
                  id="child-medical-notes"
                  value={medicalNotes}
                  onChange={(event) => setMedicalNotes(event.target.value)}
                  placeholder="Indicaciones, medicación, contactos…"
                  rows={4}
                  className="w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
                />
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
