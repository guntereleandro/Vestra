import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata = { title: "Criar conta", description: "Crie sua conta para organizar e acompanhar seus investimentos.", alternates: { canonical: "/cadastrar" }, robots: { index: false, follow: false }, openGraph: { title: "Criar conta", description: "Crie sua conta para organizar e acompanhar seus investimentos.", url: "/cadastrar" }, twitter: { card: "summary", title: "Criar conta", description: "Crie sua conta para organizar e acompanhar seus investimentos." } };

export default function SignUpPage() {
  return <AuthShell eyebrow="Nova conta" title="Criar conta" description="Use um e-mail válido e uma senha com pelo menos 8 caracteres." footer={<>Já possui conta? <Link href="/entrar" className="text-[#d9b86c]">Entrar</Link></>}><SignUpForm /></AuthShell>;
}
