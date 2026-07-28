import AuthShell from "@/components/auth/AuthShell";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export const metadata = { title: "Atualizar senha" };

export default function UpdatePasswordPage() {
  return <AuthShell eyebrow="Segurança" title="Definir nova senha" description="O link recebido deve criar uma sessão de recuperação válida antes da alteração."><UpdatePasswordForm /></AuthShell>;
}

