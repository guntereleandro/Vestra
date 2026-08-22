"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { getMarketHistory } from "@/lib/market/marketService";

const ranges = [{ value: "1mo", label: "1M" }, { value: "3mo", label: "3M" }];
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function chartPoints(prices, width = 800, height = 260) {
  const values = prices.map((item) => Number(item.close)).filter(Number.isFinite);
  if (values.length < 2) return { points: "", min: null, max: null };
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * width},${height - ((value - min) / span) * (height - 24) - 12}`).join(" ");
  return { points, min, max };
}

export default function MarketPriceChart({ ticker }) {
  const [range, setRange] = useState("3mo");
  const [state, setState] = useState({ loading: true, history: null, error: null });
  const [retry, setRetry] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    let active = true;
    const requestId = ++requestRef.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    getMarketHistory(ticker, range).then((data) => {
      if (active && requestId === requestRef.current) setState({ loading: false, history: data.history, error: null });
    }).catch((error) => {
      if (active && requestId === requestRef.current) setState({ loading: false, history: null, error: { code: error?.code || "PROVIDER_ERROR", message: error?.message || "Histórico indisponível agora." } });
    });
    return () => { active = false; };
  }, [ticker, range, retry]);

  const prices = state.history?.prices || [];
  const geometry = useMemo(() => chartPoints(prices), [prices]);
  const first = prices[0], last = prices.at(-1);

  return <section className="card fade-in rounded-3xl p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="font-display text-2xl text-white">Histórico de preço</h2><p className="mt-1 text-xs text-[#777d78]">Fechamento negociado. Preço ajustado é preservado separadamente.</p></div>
      <div className="flex rounded-xl border border-white/[.06] bg-black/20 p-1" aria-label="Período do histórico">
        {ranges.map((item) => <button key={item.value} type="button" onClick={() => setRange(item.value)} aria-pressed={range === item.value} className={`min-h-10 rounded-lg px-4 text-xs font-bold ${range === item.value ? "bg-[#d9b86c]/15 text-[#efd58f]" : "text-[#898e89]"}`}>{item.label}</button>)}
      </div>
    </div>
    {state.loading ? <div className="grid min-h-64 place-items-center" role="status"><span className="flex items-center gap-2 text-sm text-[#898e89]"><Loader2 className="animate-spin" size={18} />Carregando histórico…</span></div>
      : state.error ? <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/[.03] p-6 text-center"><AlertTriangle className="text-amber-200" size={22} /><p className="mt-3 text-sm text-white">Histórico indisponível</p><p className="mt-2 text-xs text-[#898e89]">{state.error.message}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-bold text-white"><RefreshCw size={14} />Tentar novamente</button></div>
      : prices.length < 2 ? <div className="mt-6 grid min-h-56 place-items-center rounded-2xl border border-white/[.06] bg-white/[.02] p-6 text-center text-sm text-[#898e89]">Não há pontos suficientes no período selecionado.</div>
      : <div className="mt-6 min-w-0 overflow-hidden">
        <svg viewBox="0 0 800 260" role="img" aria-label={`Histórico de fechamento de ${ticker}`} className="h-auto w-full overflow-visible">
          <defs><linearGradient id={`market-gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9b86c" stopOpacity=".28" /><stop offset="1" stopColor="#d9b86c" stopOpacity="0" /></linearGradient></defs>
          <polyline points={`0,260 ${geometry.points} 800,260`} fill={`url(#market-gradient-${ticker})`} stroke="none" />
          <polyline points={geometry.points} fill="none" stroke="#d9b86c" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          {prices.map((price, index) => {
            const span = geometry.max - geometry.min || 1;
            const x = (index / (prices.length - 1)) * 800;
            const y = 260 - ((price.close - geometry.min) / span) * 236 - 12;
            return <circle key={price.timestamp} cx={x} cy={y} r="7" fill="transparent"><title>{`${date.format(new Date(price.timestamp))}: ${currency.format(price.close)}`}</title></circle>;
          })}
        </svg>
        <div className="mt-3 flex flex-wrap justify-between gap-3 text-xs text-[#898e89]"><span>{date.format(new Date(first.timestamp))}: {currency.format(first.close)}</span><span>{date.format(new Date(last.timestamp))}: {currency.format(last.close)}</span></div>
        <p className="mt-3 text-[11px] text-[#777d78]">Fonte: {state.history.source}. Período disponível no plano atual: até 3 meses.</p>
      </div>}
  </section>;
}
