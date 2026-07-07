"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { INITIAL_ASSETS, searchAssets } from "@/lib/data/assetsMaster";

export default function AssetAutocomplete({ value, assets = INITIAL_ASSETS, onChange, onSelect, autoFocus = false, label = "Ticker ou ativo" }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const suggestions = useMemo(() => searchAssets(value, assets), [value, assets]);
  const exact = assets.some((asset) => asset.ticker.toUpperCase() === String(value || "").trim().toUpperCase());
  useEffect(() => { const outside = (event) => !root.current?.contains(event.target) && setOpen(false); document.addEventListener("mousedown", outside); return () => document.removeEventListener("mousedown", outside); }, []);
  return <div ref={root} className="relative"><label className="form-label">{label}<span className="relative mt-2 block"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#626762]" /><input autoFocus={autoFocus} required maxLength={30} value={value} onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value.toUpperCase()); setOpen(true); }} placeholder="Ex.: PETR4 ou Petrobras" autoComplete="off" className="field pl-9 uppercase" /></span></label>{open && suggestions.length > 0 && <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#111512] p-1.5 shadow-2xl">{suggestions.map((asset) => <button key={asset.ticker} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(asset); setOpen(false); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/[.05]"><span><span className="block text-xs font-bold text-[#ecebe6]">{asset.ticker}</span><span className="mt-0.5 block text-[10px] text-[#777d78]">{asset.name}</span></span><span className="shrink-0 rounded-full border border-white/[.07] px-2 py-1 text-[9px] text-[#898e89]">{asset.type}</span></button>)}</div>}{value.trim() && !exact && suggestions.length === 0 && <p className="mt-1.5 text-[10px] text-amber-400/80">Ativo não encontrado no cadastro local</p>}</div>;
}
