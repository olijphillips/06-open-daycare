import { redirect } from "next/navigation";
import { Login } from "@/components/auth/login";
import { getRole, homePathFor } from "@/lib/auth/role-gate";

export default async function LoginPage() {
  // Con sesión activa no tiene sentido ver el login: redirige al home de su panel.
  const role = await getRole();
  if (role) redirect(homePathFor(role));

  return <Login />;
}
