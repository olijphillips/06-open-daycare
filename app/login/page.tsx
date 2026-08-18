import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Login } from "@/components/auth/login";
import { createClient } from "@/utils/supabase/server";

export default async function LoginPage() {
  // Con sesión activa no tiene sentido ver el login: redirige al feed.
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return <Login />;
}
