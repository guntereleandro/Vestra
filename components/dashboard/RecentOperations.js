"use client";

import Link from "next/link";
import { Clock3, Plus, TrendingDown, TrendingUp } from "lucide-react";
import AssetLogo from "@/components/assets/AssetLogo";
import { currency, quantity } from "@/lib/engine/totals";
import { isIncomeOperation } from "@/lib/data/operations";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export default function RecentOperations({ operations }) {
  const recent = [...operations].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))).slice(0, 5);
  return <section className="card overflow-hidden rounded-2xl">
    <div className="flex items-center justify-between gap-4 border-b border-white/[.06] p-5 sm:p-6">
      <div>
        <p className="eyebrow">Movimentos</p>
        <h2 className="font-display mt-2 text-2xl">Últimas operações</h2>
      </div>
      <Link href="/operacoes" className="text-xs font-bold text-[#d9b86c] transition hover:text-[#f0d99e]">Ver todas</Link>
    </div>
    {!recent.length ? <div className="px-5 py-14 text-center sm:px-6">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#d9b86c]/20 bg-[#d9b86c]/5 text-[#d9b86c]"><Clock3 size={21} /></span>
      <h3 className="font-display mt-4 text-xl">Sem operações registradas</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#777d78]">As cinco operações mais recentes aparecerão aqui.</p>
    </div> : <div className="divide-y divide-white/[.05]">
      {recent.map((operation) => <OperationRow key={operation.id} operation={operation} />)}
    </div>}
  </section>;
}

function OperationRow({ operation }) {
  const income = isIncomeOperation(operation.operationType);
  const buy = operation.operationType === "COMPRA";
  const Icon = income ? Plus : buy ? TrendingUp : TrendingDown;
  return <Link href={`/carteira/${operation.ticker}`} className="flex items-center gap-4 p-4 transition duration-300 hover:bg-white/[.025] focus:outline focus:outline-2 focus:outline-[#d9b86c]/60 sm:p-5">
    <AssetLogo ticker={operation.ticker} name={operation.assetName} size="sm" />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-white">{operation.ticker}</p>
        <span className="rounded-full border border-white/[.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#898e89]">{operation.operationType}</span>
      </div>
      <p className="mt-1 truncate text-xs text-[#777d78]">{operation.assetName}</p>
    </div>
    <div className="hidden min-w-24 text-right text-[11px] text-[#686e69] sm:block">
      <p>{dateFormatter.format(new Date(`${operation.date}T00:00:00Z`))}</p>
      {!income ? <p className="mt-1">{quantity.format(operation.quantity)} un.</p> : null}
    </div>
    <div className="flex min-w-28 items-center justify-end gap-3 text-right">
      <div>
        <p className="text-base font-semibold text-white">{currency.format(operation.totalValue)}</p>
        <p className="mt-1 text-[10px] text-[#777d78] sm:hidden">{dateFormatter.format(new Date(`${operation.date}T00:00:00Z`))}</p>
      </div>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[.07] text-[#d9b86c]"><Icon size={15} /></span>
    </div>
  </Link>;
}
