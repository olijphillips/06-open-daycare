// Helpers de autorización por rol para la UI (panel staff vs familia).
// Módulo de servidor: lee cookies y la tabla `users` (fuente de verdad del rol).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { UserRole } from "@/lib/auth/profile";

// Devuelve el rol del usuario autenticado consultando `users`, o null sin sesión.
// La BD es la fuente de verdad: los usuarios staff existentes pueden no tener
// `role` en los claims del JWT, así que no confiamos en los metadatos de Auth.
export async function getRole(): Promise<UserRole | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return (profile?.role as UserRole | undefined) ?? null;
}

// Home del panel según el rol: staff/admin → /staff, parent → /familia.
// Sin rol (sin sesión) cae a /staff; el proxy redirige a /login igualmente.
export function homePathFor(role: UserRole | null): string {
  return role === "parent" ? "/familia" : "/staff";
}

// Gate de panel para los layouts: redirige a /login sin sesión y al home del
// otro panel si el rol no está permitido en este panel.
export async function requirePanel(
  roles: UserRole[],
  fallback: string,
): Promise<void> {
  const role = await getRole();
  if (!role) redirect("/login");
  if (!roles.includes(role)) redirect(fallback);
}
