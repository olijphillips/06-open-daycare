import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/auth/session-provider";
import { buildProfile, type SessionUser, type UserRole } from "@/lib/auth/profile";
import { createClient } from "@/utils/supabase/server";

// Tipografías del diseño: Fredoka para titulares, Nunito para cuerpo.
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenDayCare",
  description: "Feed de la guardería",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resuelve el perfil del usuario autenticado desde el server (evita parpadeo).
  // Al leer cookies, todas las rutas pasan a renderizarse de forma dinámica.
  const supabase = createClient(await cookies());

  let initialUser: SessionUser | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("full_name, role, daycares(name)")
        .eq("id", user.id)
        .single();
      if (profile) {
        initialUser = buildProfile({
          fullName: profile.full_name,
          role: profile.role as UserRole,
          daycareName: profile.daycares?.[0]?.name ?? null,
        });
      }
    }
  } catch {
    initialUser = null;
  }

  return (
    <html
      lang="es"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
      </body>
    </html>
  );
}
