import Link from "next/link";
import { Landmark } from "lucide-react";
import { brandConfig } from "@/lib/config/brandConfig";

export default function PublicShell({ children }) {
  return <div className="min-h-screen">
    <header className="border-b border-white/[.06] bg-[#090b0a]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9b86c]">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#d9b86c]/25 bg-[#d9b86c]/10 text-[#d9b86c]"><Landmark aria-hidden="true" size={18} /></span>
          <span className="font-display text-lg">{brandConfig.appName}</span>
        </Link>
        <nav aria-label="Navegação pública" className="flex items-center gap-2 sm:gap-4">
          <Link href="/mercado" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#a0a5a0] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9b86c]">Mercado</Link>
          <Link href="/entrar" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d9b86c] hover:text-[#f0d99e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9b86c]">Entrar</Link>
          <Link href="/cadastrar" className="gold-button hidden sm:inline-flex">Criar conta</Link>
        </nav>
      </div>
    </header>
    <main>{children}</main>
  </div>;
}
