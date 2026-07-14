import { currency } from "@/lib/engine/totals";
export default function DrawdownCard({ drawdown }) { return <article className="card rounded-2xl p-5"><p className="eyebrow">Maior drawdown</p><p className="mt-3 text-2xl font-semibold text-rose-300">-{currency.format(drawdown.value)}</p><p className="mt-2 text-sm text-[#b0b4b0]">{format(drawdown.percent)}%</p><p className="mt-4 text-xs leading-5 text-[#737973]">{drawdown.peakDate ? `Do pico em ${date(drawdown.peakDate)} ao menor valor em ${date(drawdown.troughDate)}.` : "Nenhuma queda entre registros foi identificada."}</p></article>; }
const format = (value) => Number(value.toFixed(1)).toLocaleString("pt-BR");
const date = (value) => value.split("-").reverse().join("/");
