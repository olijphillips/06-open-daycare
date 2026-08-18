import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Proxy de Next.js 16 (antes "middleware").
// Refresca la sesión de Supabase en cada request y pasa el token renovado
// a los Server Components y al navegador.
export async function proxy(request: NextRequest) {
  // Importante: devolver la respuesta de createClient sin modificarla
  return await createClient(request);
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
