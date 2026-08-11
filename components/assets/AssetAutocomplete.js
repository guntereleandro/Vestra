"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import AssetLogo from "@/components/assets/AssetLogo";
import { INITIAL_ASSETS } from "@/lib/data/assetsMaster";
import { normalizeSearchTerm, searchAndRankAssets } from "@/lib/market/assetSearch";
import useMarketData from "@/hooks/useMarketData";

function Highlight({ text, term }) {
  const value = String(text || "");
  const normalizedText = normalizeSearchTerm(value);
  const normalizedTerm = normalizeSearchTerm(term);
  const index = normalizedTerm ? normalizedText.indexOf(normalizedTerm) : -1;
  if (index < 0) return value;
  return <>{value.slice(0, index)}<mark className="rounded bg-[#d9b86c]/20 px-0.5 text-[#efd58f]">{value.slice(index, index + normalizedTerm.length)}</mark>{value.slice(index + normalizedTerm.length)}</>;
}

export default function AssetAutocomplete({ value, assets = INITIAL_ASSETS, onChange, onSelect, autoFocus = false, label = "Ticker ou ativo" }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const root = useRef(null);
  const { searchAssets, loading } = useMarketData({ assetsMaster: assets });
  const term = String(value || "").trim();
  const exact = useMemo(() => assets.some((asset) => asset.ticker.toUpperCase() === term.toUpperCase()), [assets, term]);

  useEffect(() => {
    let cancelled = false;
    if (!term) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const local = searchAndRankAssets(term, assets, 8);
    setSuggestions(local);
    setActiveIndex(local.length ? 0 : -1);
    const timeout = setTimeout(() => searchAssets(term).then((items) => {
      if (cancelled) return;
      setSuggestions(items);
      setActiveIndex(items.length ? 0 : -1);
    }), 320);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [term, searchAssets, assets]);

  useEffect(() => {
    const outside = (event) => !root.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  function choose(asset) {
    onSelect(asset);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (!open && ["ArrowDown", "ArrowUp"].includes(event.key)) setOpen(true);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(suggestions.length - 1, current + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    }
    if (event.key === "Enter" && open && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    }
    if (event.key === "Escape") setOpen(false);
  }

  return <div ref={root} className="relative">
    <label className="form-label">{label}<span className="relative mt-2 block"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#626762]" /><input autoFocus={autoFocus} required maxLength={30} value={value} onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} onChange={(event) => { onChange(event.target.value.toUpperCase()); setOpen(true); }} placeholder="Ex.: PETR4 ou Petrobras" autoComplete="off" className="field field-with-prefix-icon uppercase" /></span></label>
    {open && term && <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#111512] p-1.5 shadow-2xl">
      {loading && <p className="px-3 py-3 text-xs text-[#898e89]">Buscando ativos...</p>}
      {!loading && suggestions.map((asset, index) => <button key={asset.ticker} type="button" onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(asset)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left ${activeIndex === index ? "bg-white/[.07]" : "hover:bg-white/[.05]"}`}>
        <span className="flex min-w-0 items-center gap-3"><AssetLogo ticker={asset.ticker} name={asset.name} logoPath={asset.logoPath} size="sm" /><span className="min-w-0"><span className="block text-xs font-bold text-[#ecebe6]"><Highlight text={asset.ticker} term={term} /></span><span className="mt-0.5 block truncate text-[10px] text-[#777d78]"><Highlight text={asset.name} term={term} /></span></span></span>
        <span className="shrink-0 text-right"><span className="block rounded-full border border-white/[.07] px-2 py-1 text-[9px] text-[#898e89]">{asset.type}</span><span className="mt-1 block text-[9px] text-[#626762]">{asset.exchange || "B3"}</span></span>
      </button>)}
      {!loading && suggestions.length === 0 && <div className="px-3 py-3"><p className="text-xs text-[#898e89]">Nenhum ativo encontrado.</p><p className="mt-1 text-[10px] text-amber-400/80">Voce pode continuar com o ticker manual.</p></div>}
    </div>}
    {term && !exact && !open && <p className="mt-1.5 text-[10px] text-amber-400/80">Ativo nao encontrado no cadastro local. Ticker manual permitido.</p>}
  </div>;
}
