import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Database, LockKeyhole, Search, ShieldCheck, WalletCards } from "lucide-react";
import { brandConfig } from "@/lib/config/brandConfig";

const benefits = [
  { icon: WalletCards, title: "Carteira consolidada", text: "Posições, custos e resultados calculados a partir do seu histórico de operações." },
  { icon: BarChart3, title: "Acompanhamento claro", text: "Dashboard, performance e diagnósticos para entender a evolução do patrimônio." },
  { icon: Search, title: "Mercado integrado", text: "Pesquisa de ativos e cotações com fallback local permanente." },
  { icon: Database, title: "Local ou sincronizado", text: "Escolha explicitamente entre os dados deste dispositivo e sua carteira protegida no Supabase." },
];

const faq = [
  ["Meus dados locais são apagados ao criar uma conta?", "Não. Criar uma conta, entrar ou sair não remove os dados existentes neste navegador."],
  ["Preciso usar a carteira remota?", "Não. Local permanece disponível e a troca para Supabase exige uma escolha explícita."],
  ["O Mercado exige cadastro?", "Não. A pesquisa de mercado permanece pública."],
];

export default function LandingPage() {
  return <>
    <section className="relative overflow-hidden border-b border-white/[.06] px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,184,108,.15),transparent_42%)]" />
      <div className="relative mx-auto max-w-5xl text-center">
        <p className="eyebrow">Controle patrimonial com clareza</p>
        <h1 className="font-display mx-auto mt-6 max-w-4xl text-5xl leading-[1.06] text-white sm:text-6xl lg:text-7xl">Organize seus investimentos em um único lugar.</h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#a0a5a0] sm:text-lg">Registre operações, acompanhe sua carteira e entenda a evolução do patrimônio com uma experiência segura e objetiva.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/cadastrar" className="gold-button inline-flex min-w-48 items-center justify-center gap-2 py-3.5">Criar minha conta <ArrowRight aria-hidden="true" size={15} /></Link>
          <Link href="/mercado" className="inline-flex min-w-48 items-center justify-center rounded-xl border border-white/[.1] px-5 py-3.5 text-xs font-bold text-white hover:bg-white/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9b86c]">Explorar o Mercado</Link>
        </div>
        <p className="mt-5 text-xs text-[#626862]">Seus dados locais permanecem no seu dispositivo até você decidir sincronizar.</p>
      </div>
    </section>

    <section aria-labelledby="beneficios" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl"><p className="eyebrow">O essencial para acompanhar</p><h2 id="beneficios" className="font-display mt-3 text-3xl text-white sm:text-4xl">Sua carteira, sem ruído.</h2><p className="mt-4 text-sm leading-7 text-[#898e89]">Recursos que já fazem parte do produto e trabalham juntos a partir das suas operações.</p></div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, text }) => <article key={title} className="card rounded-2xl p-6"><Icon aria-hidden="true" className="text-[#d9b86c]" size={20} /><h3 className="mt-5 font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-[#898e89]">{text}</p></article>)}</div>
    </section>

    <section className="border-y border-white/[.06] bg-white/[.012] px-4 py-20 sm:px-6"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow">Como funciona</p><h2 className="font-display mt-3 text-3xl sm:text-4xl">Operações entram. Clareza sai.</h2><div className="mt-8 space-y-5">{["Registre compras, vendas e proventos.", "A engine consolida posições e resultados.", "Escolha Local ou Supabase para o uso diário."].map((text, index) => <div key={text} className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d9b86c]/25 text-xs font-bold text-[#d9b86c]">{index + 1}</span><p className="pt-1 text-sm text-[#b7bbb7]">{text}</p></div>)}</div></div><div className="card rounded-3xl p-7 sm:p-9"><ShieldCheck aria-hidden="true" className="text-[#d9b86c]" size={28} /><h2 className="font-display mt-5 text-3xl">Segurança por arquitetura.</h2><ul className="mt-6 space-y-4 text-sm text-[#a0a5a0]">{["Autenticação e sessão protegida.", "Isolamento de carteiras por Row Level Security.", "Nenhum segredo financeiro exposto ao navegador.", "Sem mistura silenciosa entre fontes de dados."].map((text) => <li key={text} className="flex gap-3"><CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[#d9b86c]" size={16} />{text}</li>)}</ul></div></div></section>

    <section aria-labelledby="faq" className="mx-auto max-w-5xl px-4 py-20 sm:px-6"><div className="text-center"><p className="eyebrow">Perguntas frequentes</p><h2 id="faq" className="font-display mt-3 text-3xl sm:text-4xl">Antes de começar</h2></div><div className="mt-10 grid gap-3">{faq.map(([question, answer]) => <article key={question} className="rounded-2xl border border-white/[.07] bg-white/[.018] p-6"><h3 className="font-semibold text-white">{question}</h3><p className="mt-2 text-sm leading-6 text-[#898e89]">{answer}</p></article>)}</div></section>

    <footer className="border-t border-white/[.06] px-4 py-8 sm:px-6"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-[#626862] sm:flex-row sm:items-center sm:justify-between"><p>{brandConfig.appName} — {brandConfig.tagline}.</p><div className="flex gap-5"><Link href="/mercado" className="hover:text-white">Mercado</Link><Link href="/entrar" className="hover:text-white">Entrar</Link><span className="inline-flex items-center gap-1.5"><LockKeyhole aria-hidden="true" size={12} />Acesso protegido</span></div></div></footer>
  </>;
}
