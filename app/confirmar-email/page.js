import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import AuthMessage from "@/components/auth/AuthMessage";

export const metadata = { title: "Confirmar e-mail" };

export default async function ConfirmEmailPage({ searchParams }) {
  const params = await searchParams;
  const success = params?.status === "success";
  return <AuthShell eyebrow="Confirmação" title={success ? "E-mail confirmado" : "Confirme seu e-mail"} description={success ? "Sua conta está pronta para acesso." : "Abra o link enviado ao seu e-mail para concluir o cadastro."} footer={<Link href="/entrar" className="text-[#d9b86c]">Ir para entrar</Link>}>
    {params?.status === "error" ? <AuthMessage>O link é inválido, expirou ou já foi utilizado. Solicite um novo cadastro ou uma nova recuperação.</AuthMessage> : null}
    {success ? <AuthMessage tone="success">Confirmação concluída com segurança.</AuthMessage> : null}
  </AuthShell>;
}

