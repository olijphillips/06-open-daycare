"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PrimaryButton } from "@/components/ui/button";
import { authDefaults, signIn } from "@/lib/mock/auth";
import { BrandPanel } from "./brand-panel";

// Pantalla de login: panel de marca (desktop) + formulario.
// No incluye el selector INGRESO COMO (Personal/Familia) del mockup.
// Al enviar guarda la sesión mock (signIn) y navega al feed.
export function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(authDefaults.loginEmail);

  function handleSubmit() {
    signIn(email);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#FBF4EC] md:grid md:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <section className="flex items-center justify-center px-10 py-10">
        <div className="w-full max-w-[392px]">
          <h2 className="font-display mb-[6px] text-[30px] font-semibold text-ink">
            Iniciar sesión
          </h2>
          <p className="mb-[28px] text-[15px] text-muted">Ingresá para ver el día de hoy.</p>

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
            Contraseña
          </div>
          <input
            type="password"
            placeholder={authDefaults.loginPasswordPlaceholder}
            className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-ink"
          />

          <div className="mb-[20px] text-right">
            <span className="cursor-pointer text-[13.5px] font-bold text-[#C5503A]">
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <PrimaryButton
            className="rounded-[15px] py-[15px] text-base"
            onClick={handleSubmit}
          >
            Iniciar sesión
          </PrimaryButton>

          <p className="mt-6 text-center text-[14.5px] text-muted">
            ¿Te invitó la guardería?{" "}
            <Link href="/activar-cuenta" className="font-extrabold text-[#C5503A]">
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
