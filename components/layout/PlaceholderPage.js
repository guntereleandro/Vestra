import { Construction } from "lucide-react";
import { brandConfig } from "@/lib/config/brandConfig";

export default function PlaceholderPage({ eyebrow = brandConfig.appName, title, description }) {
  return <div className="page-container"><header className="max-w-2xl"><p className="eyebrow">{eyebrow}</p><h1 className="font-display mt-2 text-3xl sm:text-4xl">{title}</h1><p className="mt-3 text-sm leading-relaxed text-[#777d78]">{description}</p></header><section className="card mt-8 grid min-h-72 place-items-center rounded-2xl p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><Construction size={22} /></span><h2 className="font-display mt-5 text-xl">Em desenvolvimento</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#777d78]">Estamos preparando esta área para uma próxima versão do {brandConfig.appName}.</p></div></section></div>;
}
