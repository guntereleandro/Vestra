import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { getSafeRedirectPath } from "@/lib/auth/authRedirects";

export const metadata = { title: "Entrar", description: "Acesse sua conta com seguranca.", alternates: { canonical: "/entrar" }, robots: { index: false, follow: false }, openGraph: { title: "Entrar", description: "Acesse sua conta com seguranca.", url: "/entrar" }, twitter: { card: "summary", title: "Entrar", description: "Acesse sua conta com seguranca." } };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const next = getSafeRedirectPath(params?.next);
  return <AuthShell eyebrow="Conta" title="Entrar" description="Acesse sua conta com e-mail e senha." footer={<>Ainda não possui conta? <Link href="/cadastrar" className="text-[#d9b86c]">Criar conta</Link></>}><LoginForm next={next} /></AuthShell>;
}
