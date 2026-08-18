"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PrimaryButton } from "@/components/ui/button";
import { authDefaults } from "@/lib/mock/invitation";
import { createClient } from "@/utils/supabase/client";
import { BrandPanel } from "./brand-panel";

// Modos del formulario: login normal, pedido de reset y confirmación de envío.
type Mode = "login" | "reset" | "resetSent";

// Pantalla de login: panel de marca (desktop) + formulario.
// Login real contra Supabase Auth (email+contraseña) con error inline,
// estado de carga en el botón y flujo de reset de contraseña.
export function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError("Email o contraseña incorrectos");
      setSubmitting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleReset() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
      setError("No pudimos enviar el correo. Verificá tu email.");
      setSubmitting(false);
      return;
    }
    setMode("resetSent");
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[#FBF4EC] md:grid md:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <section className="flex items-center justify-center px-10 py-10">
        <div className="w-full max-w-[392px]">
          {mode === "login" && (
            <>
              <h2 className="font-display mb-[6px] text-[30px] font-semibold text-ink">
                Iniciar sesión
              </h2>
              <p className="mb-[28px] text-[15px] text-muted">
                Ingresá para ver el día de hoy.
              </p>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authDefaults.loginPasswordPlaceholder}
                className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-ink"
              />

              <div className="mb-[20px] text-right">
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="cursor-pointer text-[13.5px] font-bold text-[#C5503A]"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && (
                <p className="mb-4 text-center text-[14px] font-bold text-[#C5503A]">
                  {error}
                </p>
              )}

              <PrimaryButton
                className="rounded-[15px] py-[15px] text-base"
                onClick={handleSubmit}
              >
                {submitting ? "Ingresando…" : "Iniciar sesión"}
              </PrimaryButton>

              <p className="mt-6 text-center text-[14.5px] text-muted">
                ¿Te invitó la guardería?{" "}
                <Link
                  href="/activar-cuenta"
                  className="font-extrabold text-[#C5503A]"
                >
                  Activá tu cuenta
                </Link>
              </p>
            </>
          )}

          {mode === "reset" && (
            <>
              <h2 className="font-display mb-[6px] text-[30px] font-semibold text-ink">
                Restablecer contraseña
              </h2>
              <p className="mb-[28px] text-[15px] text-muted">
                Te enviaremos un enlace para crear una nueva contraseña.
              </p>

              <div className="mb-[8px] text-[12px] font-bold uppercase tracking-[0.7px] text-muted">
                Email
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-ink"
              />

              {error && (
                <p className="mb-4 text-center text-[14px] font-bold text-[#C5503A]">
                  {error}
                </p>
              )}

              <PrimaryButton
                className="rounded-[15px] py-[15px] text-base"
                onClick={handleReset}
              >
                {submitting ? "Enviando…" : "Enviar enlace"}
              </PrimaryButton>

              <p className="mt-6 text-center text-[14.5px] text-muted">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="cursor-pointer font-extrabold text-[#C5503A]"
                >
                  Volver a iniciar sesión
                </button>
              </p>
            </>
          )}

          {mode === "resetSent" && (
            <>
              <h2 className="font-display mb-[6px] text-[30px] font-semibold text-ink">
                Revisá tu correo
              </h2>
              <p className="mb-[28px] text-[15px] text-muted">
                Si el email existe, te enviamos un enlace para restablecer tu
                contraseña.
              </p>

              <p className="mt-6 text-center text-[14.5px] text-muted">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="cursor-pointer font-extrabold text-[#C5503A]"
                >
                  Volver a iniciar sesión
                </button>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
