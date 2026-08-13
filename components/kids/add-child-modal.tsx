"use client";

import { useState, type FormEvent } from "react";
import type { Child } from "@/lib/mock/children";
import { buildNewChild, classrooms } from "@/lib/mock/children";

interface AddChildModalProps {
  onClose: () => void;
  onSave: (child: Child) => void;
}

// Aplica la máscara dd/mm/aaaa: inserta "/" mientras se escribe y acota a 10 chars.
function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Modal "Agregar niño" con los 3 campos obligatorios del SPEC 04.
// Estilo fiel a references/pantallas/agregar-nino.dc.html.
export function AddChildModal({ onClose, onSave }: AddChildModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [classroom, setClassroom] = useState(classrooms[0]);
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; birthDate?: string }>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: { name?: string; birthDate?: string } = {};
    if (!name.trim()) nextErrors.name = "Ingresa el nombre";
    if (birthDate.length < 10) nextErrors.birthDate = "Ingresa la fecha completa";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave(buildNewChild({ name, birthDate, classroom, allergies, medicalNotes }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.35)] px-6 py-10">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.45)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">
            Agregar niño
          </span>
          <button
            type="submit"
            className="text-[15px] font-extrabold text-accent"
          >
            Guardar
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-[26px] py-6">
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
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Martina López"
              className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="-mt-[12px] mb-[18px] text-[12.5px] font-bold text-[#D9583C]">
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
              />
              {errors.birthDate && (
                <p className="-mt-[12px] mb-[18px] text-[12.5px] font-bold text-[#D9583C]">
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
                value={classroom}
                onChange={(event) => setClassroom(event.target.value)}
                className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] font-bold text-ink outline-none focus:border-primary"
              >
                {classrooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
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
  );
}
