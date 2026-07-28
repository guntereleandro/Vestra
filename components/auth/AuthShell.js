import Link from "next/link";
import { Landmark, ShieldCheck } from "lucide-react";
import { brandConfig } from "@/lib/config/brandConfig";

export default function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <div className="page-container flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <section className="card fade-in w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label={`Voltar ao ${brandConfig.appName}`} className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d9b86c]/20 bg-[#d9b86c]/10 text-[#d9b86c]">
            <Landmark size={20} />
          </Link>
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#687069]">
            <ShieldCheck size={14} /> Acesso seguro
          </span>
        </div>
        <p className="eyebrow mt-8">{eyebrow}</p>
        <h1 className="font-display mt-2 text-3xl text-white">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#898e89]">{description}</p>
        <div className="mt-7">{children}</div>
        {footer ? <div className="mt-6 border-t border-white/[.06] pt-5 text-center text-xs text-[#777d78]">{footer}</div> : null}
      </section>
    </div>
  );
}

