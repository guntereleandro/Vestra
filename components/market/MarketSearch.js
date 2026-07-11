"use client";

import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AssetLogo from "@/components/assets/AssetLogo";
import { searchMarketAssets } from "@/lib/market/marketService";

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 30);
}

function highlight(text, query) {
  const value = String(text || "");
  const term = String(query || "").trim();
  if (!term) return value;
  const index = value.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) return value;
  return <>
    {value.slice(0, index)}
    <mark className="rounded bg-[#d9b86c]/18 px-0.5 text-[#efd58f]">{value.slice(index, index + term.length)}</mark>
    {value.slice(index + term.length)}
  </>;
}

export default function MarketSearch({ initialQuery = "" }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const normalizedQuery = useMemo(() => normalizeTicker(query), [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = query.trim();
    let active = true;
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const assets = await searchMarketAssets(term);
        if (active) {
          setResults(assets);
          setSelectedIndex(0);
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  function openTicker(ticker) {
    const target = normalizeTicker(ticker || results[selectedIndex]?.ticker || normalizedQuery);
    if (target) router.push(`/mercado/${target}`);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openTicker();
    }
  }

  return <div className="relative w-full">
    <div className="relative">
      <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#d9b86c]" size={21} />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Pesquisar por ticker, nome ou empresa"
        aria-label="Pesquisar ativos no mercado"
        className="w-full rounded-2xl border border-white/[.08] bg-[#070908]/85 py-5 pl-14 pr-12 text-base text-white outline-none shadow-[0_20px_70px_rgba(0,0,0,.25)] transition focus:border-[#d9b86c]/60 focus:shadow-[0_0_0_4px_rgba(217,184,108,.08)] sm:text-lg"
      />
      {loading && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-[#898e89]" size={19} />}
    </div>

    {(results.length > 0 || (query.trim().length >= 2 && !loading)) && <div className="absolute z-30 mt-3 w-full overflow-hidden rounded-2xl border border-white/[.08] bg-[#101311]/98 shadow-[0_24px_90px_rgba(0,0,0,.45)] backdrop-blur-xl">
      <div className="max-h-80 overflow-y-auto p-2">
        {results.length ? results.map((asset, index) => <button
          key={asset.ticker}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => openTicker(asset.ticker)}
          className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${index === selectedIndex ? "bg-[#d9b86c]/10 text-white" : "text-[#c6cac5] hover:bg-white/[.035]"}`}
        >
          <AssetLogo ticker={asset.ticker} name={asset.name} logoPath={asset.logoPath} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{highlight(asset.ticker, query)}</span>
            <span className="block truncate text-xs text-[#898e89]">{highlight(asset.name || asset.shortName, query)}</span>
          </span>
          <span className="hidden rounded-full border border-white/[.06] px-2 py-1 text-[10px] font-semibold text-[#777d78] sm:inline">{asset.type || "Ativo"}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#d9b86c]">{asset.exchange || "B3"}</span>
        </button>) : <div className="px-5 py-8 text-center">
          <p className="font-display text-lg text-white">Ativo nao encontrado</p>
          <p className="mt-2 text-sm text-[#898e89]">Pressione Enter para abrir a busca por {normalizedQuery || "este ticker"}.</p>
        </div>}
      </div>
    </div>}
  </div>;
}
