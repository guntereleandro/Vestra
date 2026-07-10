import Link from "next/link";
import { BriefcaseBusiness, Edit3 } from "lucide-react";
import AssetLogo from "@/components/assets/AssetLogo";
import QuoteInfo from "@/components/quotes/QuoteInfo";
import { currency, percent, quantity } from "@/lib/engine/totals";

export default function PositionsTable({ positions, emptyMessage = "Nenhuma posicao em carteira", onEditQuote }) {
  if (!positions.length) return <div className="px-5 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><BriefcaseBusiness size={22} /></span><h3 className="font-display mt-5 text-xl">{emptyMessage}</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#777d78]">Registre uma compra em Operacoes para formar sua carteira.</p></div>;
  const heads = ["Ativo", "Tipo", "Quantidade", "Preco medio", "Cotacao atual", "Valor atual", "Resultado", "Proventos", ...(onEditQuote ? ["Acoes"] : [])];
  return <div className="p-3 sm:overflow-x-auto sm:p-0">
    <table className="asset-table w-full border-collapse text-left">
      <thead><tr className="text-[9px] uppercase tracking-[.14em] text-[#626762]">{heads.map((head) => <th key={head} className="border-b border-white/[.06] px-5 py-4">{head}</th>)}</tr></thead>
      <tbody>{positions.map((position) => {
        const gain = position.profit >= 0;
        return <tr key={position.ticker} className="hover:bg-white/[.018]">
          <td className="border-b border-white/[.05] px-5 py-4">
            <Link href={`/carteira/${position.ticker}`} className="flex items-center gap-3 rounded-lg focus:outline focus:outline-2 focus:outline-[#d9b86c]/60">
              <AssetLogo ticker={position.ticker} name={position.name} logoPath={position.logoPath} />
              <div><p className="text-sm font-bold">{position.ticker}</p><p className="text-[10px] text-[#777d78]">{position.name}</p></div>
            </Link>
          </td>
          <td data-label="Tipo" className="asset-cell">{position.type}{position.exchange ? <p className="mt-1 text-[10px] text-[#777d78]">{position.exchange}</p> : null}</td>
          <td data-label="Quantidade" className="asset-cell">{quantity.format(position.quantity)}</td>
          <td data-label="Preco medio" className="asset-cell">{currency.format(position.averagePrice)}</td>
          <td data-label="Cotacao atual" className="asset-cell"><p>{currency.format(position.currentPrice)}</p><QuoteInfo hasQuote={position.hasQuote} updatedAt={position.quoteUpdatedAt} origin={position.quoteOrigin} stale={position.quoteStale} manualOverride={position.manualOverride} /></td>
          <td data-label="Valor atual" className="asset-cell font-bold text-white">{currency.format(position.currentValue)}</td>
          <td data-label="Resultado" className="asset-cell"><p className={`font-bold ${gain ? "text-emerald-400" : "text-rose-400"}`}>{gain ? "+" : ""}{currency.format(position.profit)}</p><p className={`text-[10px] ${gain ? "text-emerald-400/70" : "text-rose-400/70"}`}>{gain ? "+" : ""}{percent.format(position.profitability)}%</p></td>
          <td data-label="Proventos" className="asset-cell">{currency.format(position.dividends)}</td>
          {onEditQuote && <td className="border-b border-white/[.05] px-5 py-4"><button onClick={() => onEditQuote(position)} aria-label={`Editar cotacao ${position.ticker}`} className="icon-button"><Edit3 size={15} /></button></td>}
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
