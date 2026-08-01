"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Bot, Calculator, ChartNoAxesCombined, ClipboardList, Coins, Goal, Landmark, LayoutDashboard, Menu, Search, Settings, UserRound, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";
import CommandPalette from "@/components/command/CommandPalette";
import { getContextualHelpHref } from "@/lib/knowledge/knowledgeService";
import { brandConfig } from "@/lib/config/brandConfig";
import PublicShell from "@/components/layout/PublicShell";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/carteira", label: "Carteira", icon: WalletCards },
  { href: "/operacoes", label: "Operações", icon: ClipboardList },
  { href: "/proventos", label: "Proventos", icon: Coins },
  { href: "/objetivos", label: "Objetivos", icon: Goal },
  { href: "/mercado", label: "Mercado", icon: Search },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/imposto-de-renda", label: "Imposto de Renda", icon: Calculator },
  { href: "/simulacoes", label: "Simulações", icon: ChartNoAxesCombined },
  { href: "/ia", label: "IA", icon: Bot },
  { href: "/conhecimento", label: "Central de Conhecimento", icon: BookOpen },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/conta", label: "Conta", icon: UserRound },
];

function Brand() {
  return <Link href="/dashboard" className="flex items-center gap-3 text-[#d7d9d5] transition hover:text-white">
    <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/10 text-[#d9b86c]"><Landmark size={18} strokeWidth={2} /></span>
    <div>
      <p className="font-display text-lg leading-none">{brandConfig.appName}</p>
      <p className="mt-1 text-[8px] font-bold uppercase tracking-[.28em] text-[#5d635e]">Wealth manager</p>
    </div>
  </Link>;
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => { document.body.style.overflow = menuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen]);
  const publicRoute = pathname === "/" || pathname.startsWith("/mercado") || ["/entrar", "/cadastrar", "/recuperar-senha", "/atualizar-senha", "/confirmar-email"].some((route) => pathname.startsWith(route));
  if (publicRoute) return <PublicShell>{children}</PublicShell>;
  const isActive = (href) => pathname.startsWith(href);
  const helpHref = getContextualHelpHref(pathname);

  return <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[.045] bg-[#090b0a]/92 p-5 lg:flex lg:flex-col">
      <Brand />
      <p className="mb-3 mt-10 px-3 text-[8px] font-bold uppercase tracking-[.22em] text-[#424842]">Navegação</p>
      <nav className="space-y-1">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition duration-200 ${active ? "bg-[#d9b86c]/10 text-[#efd58f]" : "text-[#686e69] hover:bg-white/[.025] hover:text-[#d7d9d5]"}`}>
            <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
            <span className={active ? "font-semibold" : "font-medium"}>{label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d9b86c]" />}
          </Link>;
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/[.045] bg-white/[.015] p-4">
        <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8f7e55]">Dados locais</p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#5d635e]">Sua carteira permanece somente neste navegador.</p>
      </div>
    </aside>
    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[.05] bg-[#090b0a]/90 px-4 backdrop-blur-xl lg:hidden"><Brand /><button onClick={() => setMenuOpen(true)} aria-label="Abrir navegação" className="icon-button"><Menu size={19} /></button></header>
      <main className="min-h-screen pb-24 lg:pb-0">{helpHref && !pathname.startsWith("/conhecimento") && <div className="pointer-events-none fixed right-4 top-20 z-20 lg:right-8 lg:top-5"><Link href={helpHref} className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#d9b86c]/20 bg-[#101311]/95 px-3 py-2 text-[10px] font-semibold text-[#d9b86c] shadow-lg backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-[#d9b86c]/60"><BookOpen size={13} />Aprender esta página</Link></div>}{children}</main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/[.07] bg-[#0b0e0c]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {navigation.slice(0, 4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 py-2.5 text-[9px] ${isActive(href) ? "text-[#d9b86c]" : "text-[#686e69]"}`}><Icon size={19} /><span className="truncate">{label}</span></Link>)}
      <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[9px] text-[#686e69]"><Menu size={19} /><span>Mais</span></button>
    </nav>
    {menuOpen && <div className="fixed inset-0 z-[60] bg-black/75 p-4 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMenuOpen(false)}>
      <div className="card mx-auto mt-12 max-w-lg rounded-3xl p-5">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Navegação</p><h2 className="font-display mt-1 text-2xl">Explorar {brandConfig.appName}</h2></div><button onClick={() => setMenuOpen(false)} className="icon-button" aria-label="Fechar navegação"><X size={18} /></button></div>
        <nav className="mt-6 grid grid-cols-2 gap-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-semibold ${isActive(href) ? "border-[#d9b86c]/25 bg-[#d9b86c]/10 text-[#efd58f]" : "border-white/[.06] text-[#898e89]"}`}><Icon size={17} />{label}</Link>)}</nav>
      </div>
    </div>}
    <CommandPalette />
  </div>;
}
