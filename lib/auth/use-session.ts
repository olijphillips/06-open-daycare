"use client";

import { useContext } from "react";
import { SessionContext } from "@/components/auth/session-provider";
import type { SessionUser } from "@/lib/auth/profile";

// Hook de sesión: devuelve el usuario autenticado (o null) desde el provider.
// En páginas protegidas siempre debería haber usuario (el proxy lo garantiza).
export function useSessionUser(): SessionUser | null {
  return useContext(SessionContext);
}
