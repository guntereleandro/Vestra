import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Mail } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import { getServerAuthUser } from "@/lib/auth/serverAuthService";

export const metadata = { title: "Conta" };

function formatDate(value) {
  if (!value) return "Não disponível";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date)
    : "Não disponível";
}

export default async function AccountPage() {
  let user;
  try {
    user = await getServerAuthUser();
  } catch {
    redirect("/entrar?next=/conta");
  }
  if (!user) redirect("/entrar?next=/conta");

  return <div className="page-container">
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Conta</p>
      <h1 className="font-display mt-2 text-4xl text-white">Seu acesso</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#898e89]">A conta autentica seu acesso. Sua carteira, operações e preferências continuam armazenadas somente neste navegador durante esta fase do Core.</p>
      <section className="card mt-8 rounded-3xl p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[.06] bg-white/[.018] p-4"><Mail size={17} className="text-[#d9b86c]" /><p className="mt-4 text-[10px] uppercase tracking-[.14em] text-[#687069]">E-mail</p><p className="mt-1 break-all text-sm text-white">{user.email}</p></div>
          <div className="rounded-2xl border border-white/[.06] bg-white/[.018] p-4"><CheckCircle2 size={17} className="text-[#d9b86c]" /><p className="mt-4 text-[10px] uppercase tracking-[.14em] text-[#687069]">Confirmação</p><p className="mt-1 text-sm text-white">{user.email_confirmed_at ? "E-mail confirmado" : "Confirmação pendente"}</p></div>
          <div className="rounded-2xl border border-white/[.06] bg-white/[.018] p-4 sm:col-span-2"><CalendarDays size={17} className="text-[#d9b86c]" /><p className="mt-4 text-[10px] uppercase tracking-[.14em] text-[#687069]">Último acesso registrado</p><p className="mt-1 text-sm text-white">{formatDate(user.last_sign_in_at)}</p></div>
        </div>
        <div className="mt-7 border-t border-white/[.06] pt-6"><SignOutButton /></div>
      </section>
    </div>
  </div>;
}

