"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth/profile";
import { createClient } from "@/utils/supabase/client";

const SessionContext = createContext<SessionUser | null>(null);

// Provider de sesión: expone el usuario autenticado a los componentes cliente.
// Recibe el usuario inicial resuelto desde el server (evita parpadeo) y se
// sincroniza con Supabase Auth: al cerrar sesión redirige a /login.
export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [prevInitial, setPrevInitial] = useState(initialUser);

  // Ajusta el estado cuando cambia el usuario inicial de un render server nuevo
  // (ej. tras iniciar sesión). Patrón de React: ajustar estado cuando cambia una prop.
  if (initialUser !== prevInitial) {
    setPrevInitial(initialUser);
    setUser(initialUser);
  }

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        router.replace("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export { SessionContext };
