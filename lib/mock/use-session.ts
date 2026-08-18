"use client";

import { useSyncExternalStore } from "react";
import { currentUser } from "@/lib/mock/feed";
import { getSessionUser, subscribeToSession, type SessionUser } from "@/lib/mock/auth";

// Hook de sesión mock: devuelve el usuario autenticado (si hay sesión) o el mock por defecto.
// getServerSnapshot devuelve null para que el server-render siempre muestre el usuario base
// y, tras la hidratación, se re-renderice con la sesión real del cliente.
export function useSessionUser(): SessionUser {
  return useSyncExternalStore(subscribeToSession, getSessionUser, () => null) ?? currentUser;
}
