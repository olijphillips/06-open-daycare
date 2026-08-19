import { ActivateAccount } from "@/components/auth/activate-account";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Página de activación de cuenta. En Next 16 searchParams es una Promise;
// se desenvuelve con await y se pasa el código al componente cliente.
export default async function ActivateAccountPage({ searchParams }: PageProps) {
  const { code } = await searchParams;
  const codeValue = Array.isArray(code) ? code[0] : code;

  return <ActivateAccount code={codeValue} />;
}
