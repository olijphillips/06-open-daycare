import { redirect } from "next/navigation";
import { getRole, homePathFor } from "@/lib/auth/role-gate";

// Raíz de la app: redirige al home del panel según el rol.
// Staff/admin → /staff; parent → /familia. El proxy manda a /login si no hay sesión.
export default async function HomePage() {
  const role = await getRole();
  if (!role) redirect("/login");
  redirect(homePathFor(role));
}
