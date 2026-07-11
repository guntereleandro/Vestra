"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, BadgePercent, Building2, CalendarDays, ExternalLink, Landmark, Loader2, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import AssetLogo from "@/components/assets/AssetLogo";
import MarketSearch from "@/components/market/MarketSearch";
import { getMarketAsset, getMarketQuote } from "@/lib/market/marketService";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const primaryIndicators = [
  { key: "priceEarnings", label: "P/L", type: "number" },
  { key: "priceBook", label: "P/VP", type: "number" },
  { key: "dividendYield", label: "Dividend Yield", type: "percent" },
  { key: "roe", label: "ROE", type: "percent" },
];

const secondaryIndicators = [
  { key: "roic", label: "ROIC", type: "percent" },
  { key: "netMargin", label: "Margem Liquida", type: "percent" },
  { key: "ebitdaMargin", label: "Margem EBITDA", type: "percent" },
  { key: "currentLiquidity", label: "Liquidez Corrente", type: "number" },
  { key: "bookValuePerShare", label: "VPA", type: "currency" },
  { key: "earningsPerShare", label: "LPA", type: "currency" },
];

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 30);
}

function formatCurrency(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? currency.format(Number(value)) : "Sem cotacao";
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? dateTime.format(date) : "Atualizacao indisponivel";
}

function formatIndicator(value, type) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  if (type === "currency") return currency.format(parsed);
  if (type === "percent") return `${number.format(Math.abs(parsed) <= 1 ? parsed * 100 : parsed)}%`;
  return number.format(parsed);
}

function UnavailableBadge({ compact = false }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border border-white/[.06] bg-white/[.025] font-semibold text-[#777d78] ${compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}>
    <Minus size={compact ? 12 : 14} />
    Indisponivel
  </span>;
}

function IndicatorCard({ item, value, featured = false }) {
  const formatted = formatIndicator(value, item.type);
  return <article className={`card fade-in rounded-2xl transition duration-200 hover:-translate-y-0.5 hover:border-[#d9b86c]/22 ${featured ? "min-h-36 p-6" : "min-h-28 p-5"}`}>
    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#777d78]">{item.label}</p>
    <div className="mt-5">
      {formatted ? <p className={`${featured ? "text-3xl" : "text-xl"} font-bold text-white`}>{formatted}</p> : <UnavailableBadge compact={!featured} />}
    </div>
  </article>;
}

function EmptyState({ title, description }) {
  return <div className="card fade-in rounded-3xl p-10 text-center sm:p-14">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#d9b86c]/15 bg-[#d9b86c]/8 text-[#d9b86c]"><AlertTriangle size={22} /></div>
    <h2 className="font-display mt-5 text-2xl text-white">{title}</h2>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#898e89]">{description}</p>
    <Link href="/mercado" className="gold-button mt-7 inline-flex">Pesquisar outro ativo</Link>
  </div>;
}

export default function MarketAssetPage({ ticker }) {
  const normalizedTicker = useMemo(() => normalizeTicker(ticker), [ticker]);
  const [asset, setAsset] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [assetData, quoteData] = await Promise.all([getMarketAsset(normalizedTicker), getMarketQuote(normalizedTicker)]);
        if (!active) return;
        setAsset(assetData);
        setQuote(quoteData);
        if (!assetData && !quoteData) setError("ASSET_NOT_FOUND");
      } catch {
        if (active) setError("PROVIDER_ERROR");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (normalizedTicker) load();
    else {
      setLoading(false);
      setError("INVALID_TICKER");
    }
    return () => {
      active = false;
    };
  }, [normalizedTicker]);

  const dividends = useMemo(() => [...(asset?.dividends || []), ...(quote?.dividends || [])]
    .filter((item) => item?.date && Number(item.value) > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12), [asset, quote]);

  const hasQuote = Number.isFinite(Number(quote?.price)) && Number(quote?.price) > 0;
  const change = Number(quote?.change);
  const changePercent = Number(quote?.changePercent);
  const hasChange = Number.isFinite(change);
  const changeTone = change > 0 ? "text-emerald-300" : change < 0 ? "text-rose-300" : "text-[#c6cac5]";
  const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  if (loading) return <section className="page-container">
    <div className="card fade-in mx-auto min-h-[32rem] max-w-5xl overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#d9b86c]/12" />
        <Loader2 className="animate-spin text-[#d9b86c]" size={28} />
      </div>
      <div className="mt-12 max-w-2xl space-y-4">
        <div className="h-5 w-32 animate-pulse rounded-full bg-white/[.06]" />
        <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-white/[.08]" />
        <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/[.045]" />
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-white/[.06] bg-white/[.025]" />)}
      </div>
      <p className="mt-8 text-sm text-[#898e89]">Preparando uma visao clara do ativo.</p>
    </div>
  </section>;

  if (error === "ASSET_NOT_FOUND" || error === "INVALID_TICKER") return <section className="page-container space-y-8">
    <MarketSearch initialQuery={normalizedTicker} />
    <EmptyState title="Ativo nao encontrado" description="Nao encontramos dados locais ou de mercado para este ticker. Confira o codigo ou pesquise pelo nome da empresa." />
  </section>;

  if (error && !asset && !quote) return <section className="page-container space-y-8">
    <MarketSearch initialQuery={normalizedTicker} />
    <EmptyState title="Nao foi possivel carregar o ativo" description="O provedor pode estar temporariamente indisponivel. Tente pesquisar novamente em instantes." />
  </section>;

  return <section className="page-container space-y-12">
    <Link href="/mercado" className="inline-flex items-center gap-2 text-sm font-semibold text-[#898e89] transition hover:text-white"><ArrowLeft size={16} /> Voltar para Mercado</Link>

    <div className="card fade-in overflow-hidden rounded-[2rem]">
      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#d9b86c]/8 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-4">
              <AssetLogo ticker={normalizedTicker} name={asset?.name} logoPath={asset?.logoPath} size="lg" />
              <div className="min-w-0">
                <p className="eyebrow">{asset?.exchange || "Mercado publico"}</p>
                <h1 className="font-display mt-2 text-4xl leading-tight text-white sm:text-6xl">{asset?.name || normalizedTicker}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d9b86c]/20 bg-[#d9b86c]/8 px-3 py-1 text-xs font-bold text-[#efd58f]">{normalizedTicker}</span>
                  <span className="rounded-full border border-white/[.06] bg-white/[.025] px-3 py-1 text-xs font-semibold text-[#898e89]">{asset?.type || "Ativo"}</span>
                </div>
              </div>
            </div>
            <div className="mt-10 grid gap-3 text-sm text-[#898e89] sm:grid-cols-3">
              <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.018] px-4"><Building2 size={16} /> {asset?.sector || "Setor indisponivel"}</span>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.018] px-4"><Landmark size={16} /> {asset?.segment || "Segmento indisponivel"}</span>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.018] px-4"><CalendarDays size={16} /> {formatDate(quote?.updatedAt || asset?.updatedAt)}</span>
            </div>
          </div>
          <aside className="rounded-[1.75rem] border border-[#d9b86c]/16 bg-[#d9b86c]/7 p-6 shadow-[0_24px_80px_rgba(0,0,0,.25)] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8f7e55]">Cotacao</p>
            <p className="mt-4 text-5xl font-bold leading-none text-white sm:text-6xl">{hasQuote ? formatCurrency(quote.price) : "Sem cotacao"}</p>
            <div className={`mt-5 inline-flex items-center gap-2 rounded-full border border-white/[.07] bg-[#090b0a]/45 px-3 py-2 text-sm font-bold ${changeTone}`}>
              <ChangeIcon size={16} />
              {hasChange ? `${currency.format(change)} ` : "Variacao indisponivel "}
              {Number.isFinite(changePercent) ? `(${number.format(changePercent)}%)` : ""}
            </div>
            <p className="mt-6 text-xs leading-5 text-[#898e89]">Origem: {quote?.source || asset?.source || "local"}. Ultima atualizacao: {formatDate(quote?.updatedAt || asset?.updatedAt)}.</p>
          </aside>
        </div>
      </div>
    </div>

    <section>
      <div className="mb-5 flex items-center gap-2">
        <BadgePercent className="text-[#d9b86c]" size={18} />
        <h2 className="font-display text-2xl text-white">Principais indicadores</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryIndicators.map((item) => <IndicatorCard key={item.key} item={item} value={asset?.indicators?.[item.key]} featured />)}
      </div>
    </section>

    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-white">Indicadores secundarios</h2>
        <span className="hidden text-xs text-[#777d78] sm:inline">Campos ausentes aparecem como indisponiveis.</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {secondaryIndicators.map((item) => <IndicatorCard key={item.key} item={item} value={asset?.indicators?.[item.key]} />)}
      </div>
    </section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
      <section className="card fade-in rounded-3xl p-6">
        <h2 className="font-display text-2xl text-white">Dividendos</h2>
        {dividends.length ? <div className="mt-5 divide-y divide-white/[.06]">
          {dividends.map((dividend, index) => <div key={`${dividend.date}-${index}`} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-bold text-white">{dividend.type || "Dividendo"}</p>
              <p className="mt-1 text-xs text-[#777d78]">{dateOnly.format(new Date(dividend.date))}</p>
            </div>
            <p className="text-sm font-bold text-emerald-300">{currency.format(Number(dividend.value))}</p>
          </div>)}
        </div> : <div className="mt-6 rounded-2xl border border-white/[.06] bg-white/[.02] p-7 text-center">
          <Sparkles className="mx-auto text-[#d9b86c]" size={22} />
          <p className="mt-3 text-sm font-semibold text-white">Historico nao disponivel</p>
          <p className="mt-2 text-sm leading-6 text-[#898e89]">Quando o provedor retornar dividendos para este ativo, eles aparecem aqui.</p>
        </div>}
      </section>

      <section className="card fade-in rounded-3xl p-6">
        <h2 className="font-display text-2xl text-white">Sobre a empresa</h2>
        <p className="mt-5 text-sm leading-7 text-[#c6cac5]">{asset?.description || "Ainda nao ha uma descricao publica disponivel para este ativo."}</p>
        <div className="mt-6 space-y-3 text-sm">
          <p className="flex justify-between gap-4 border-b border-white/[.06] pb-3"><span className="text-[#777d78]">Setor</span><strong className="text-right text-white">{asset?.sector || "Indisponivel"}</strong></p>
          <p className="flex justify-between gap-4 border-b border-white/[.06] pb-3"><span className="text-[#777d78]">Segmento</span><strong className="text-right text-white">{asset?.segment || "Indisponivel"}</strong></p>
          {asset?.website ? <a href={asset.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-[#d9b86c] transition hover:text-[#f0d99e]">Site oficial <ExternalLink size={15} /></a> : <p className="pt-2 text-sm text-[#777d78]">Site oficial indisponivel.</p>}
        </div>
      </section>
    </div>
  </section>;
}
