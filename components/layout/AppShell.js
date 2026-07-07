"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Calculator, ChartNoAxesCombined, ClipboardList, Coins, Goal, Landmark, LayoutDashboard, Menu, Settings, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/carteira", label: "Carteira", icon: WalletCards },
  { href: "/operacoes", label: "Operações", icon: ClipboardList },
  { href: "/proventos", label: "Proventos", icon: Coins },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/metas", label: "Metas", icon: Goal },
  { href: "/imposto-de-renda", label: "Imposto de Renda", icon: Calculator },
  { href: "/simulacoes", label: "Simulações", icon: ChartNoAxesCombined },
  { href: "/ia", label: "IA", icon: Bot },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function Brand() { return <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9b86c] text-[#090b0a]"><Landmark size={20} strokeWidth={2.2} /></span><div><p className="font-display text-xl leading-none">Vestra</p><p className="mt-1 text-[8px] font-bold uppercase tracking-[.28em] text-[#777d78]">Wealth manager</p></div></Link>; }

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => { document.body.style.overflow = menuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen]);
  const isActive = (href) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] border-r border-white/[.07] bg-[#0b0e0c]/95 p-5 lg:flex lg:flex-col"><Brand /><p className="mb-3 mt-10 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#555b56]">Navegação</p><nav className="space-y-1">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${isActive(href) ? "bg-[#d9b86c]/10 text-[#efd58f]" : "text-[#777d78] hover:bg-white/[.035] hover:text-white"}`}><Icon size={17} /><span>{label}</span>{isActive(href) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d9b86c]" />}</Link>)}</nav><div className="mt-auto rounded-2xl border border-[#d9b86c]/10 bg-[#d9b86c]/[.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#d9b86c]">Dados locais</p><p className="mt-2 text-[11px] leading-relaxed text-[#686e69]">Sua carteira permanece somente neste navegador.</p></div></aside>
    <div className="min-w-0 lg:col-start-2"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[.06] bg-[#090b0a]/90 px-4 backdrop-blur-xl lg:hidden"><Brand /><button onClick={() => setMenuOpen(true)} aria-label="Abrir navegação" className="icon-button"><Menu size={19} /></button></header><main className="min-h-screen pb-24 lg:pb-0">{children}</main></div>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/[.08] bg-[#0b0e0c]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">{navigation.slice(0, 4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 py-2.5 text-[9px] ${isActive(href) ? "text-[#d9b86c]" : "text-[#686e69]"}`}><Icon size={19} /><span className="truncate">{label}</span></Link>)}<button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[9px] text-[#686e69]"><Menu size={19} /><span>Mais</span></button></nav>
    {menuOpen && <div className="fixed inset-0 z-[60] bg-black/75 p-4 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMenuOpen(false)}><div className="card mx-auto mt-12 max-w-lg rounded-3xl p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">Navegação</p><h2 className="font-display mt-1 text-2xl">Explorar Vestra</h2></div><button onClick={() => setMenuOpen(false)} className="icon-button" aria-label="Fechar navegação"><X size={18} /></button></div><nav className="mt-6 grid grid-cols-2 gap-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-semibold ${isActive(href) ? "border-[#d9b86c]/25 bg-[#d9b86c]/10 text-[#efd58f]" : "border-white/[.06] text-[#898e89]"}`}><Icon size={17} />{label}</Link>)}</nav></div></div>}
  </div>;
}
