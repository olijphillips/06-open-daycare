import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Proxy de Next.js 16 (antes "middleware").
// Refresca la sesión de Supabase en cada request, valida el usuario y
// protege las rutas del feed: sin sesión válida redirige a /login.
export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname === "/" ||
    pathname === "/kids" ||
    pathname.startsWith("/kids/") ||
    pathname === "/crear-publicacion";

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Ejecuta el proxy en todas las rutas excepto:
     * - archivos estáticos internos de Next.js
     * - favicon
     * - imágenes y fuentes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
