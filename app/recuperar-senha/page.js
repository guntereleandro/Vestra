import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RecoveryForm from "@/components/auth/RecoveryForm";

export const metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return <AuthShell eyebrow="Recuperação" title="Recuperar senha" description="Informe seu e-mail para receber as instruções de redefinição." footer={<Link href="/entrar" className="text-[#d9b86c]">Voltar para entrar</Link>}><RecoveryForm /></AuthShell>;
}

