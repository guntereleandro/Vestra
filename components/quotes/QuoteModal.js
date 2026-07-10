"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import AssetAutocomplete from "@/components/assets/AssetAutocomplete";
import { INITIAL_ASSETS } from "@/lib/data/assetsMaster";

export default function QuoteModal({ position, quote, masterAsset, assetsMaster = INITIAL_ASSETS, detailed = false, onClose, onSave, onClear, onUseAutomatic }) {
  const [selectedAsset, setSelectedAsset] = useState(masterAsset || position);
  const [form, setForm] = useState({ currentQuote: quote?.manualPrice ?? quote?.currentQuote ?? "", updatedAt: quote?.manualUpdatedAt || quote?.updatedAt || new Date().toISOString().slice(0, 10), sector: masterAsset?.sector || position.sector || "", notes: masterAsset?.notes || "" });
  const [error, setError] = useState("");
  useEffect(() => { const close = (event) => event.key === "Escape" && onClose(); document.addEventListener("keydown", close); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; }; }, [onClose]);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  function submit(event) {
    event.preventDefault();
    if (form.currentQuote === "" || !Number.isFinite(Number(form.currentQuote)) || Number(form.currentQuote) < 0) return setError("Informe uma cotacao valida.");
    onSave({
      ticker: selectedAsset.ticker,
      name: selectedAsset.name || position.name,
      shortName: selectedAsset.shortName,
      type: selectedAsset.type || position.type,
      subtype: selectedAsset.subtype,
      exchange: selectedAsset.exchange,
      currency: selectedAsset.currency,
      logoPath: selectedAsset.logoPath,
      currentQuote: Number(form.currentQuote),
      updatedAt: form.updatedAt,
      origin: "manual",
      sector: form.sector.trim(),
      notes: form.notes.trim(),
    });
  }

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="quote-title" className="card w-full rounded-t-3xl p-5 sm:max-w-lg sm:rounded-3xl sm:p-7">
      <div className="flex items-center justify-between"><div><p className="eyebrow">{selectedAsset.ticker}</p><h2 id="quote-title" className="font-display mt-1 text-2xl">Atualizar cotacao</h2></div><button onClick={onClose} aria-label="Fechar" className="icon-button"><X size={18} /></button></div>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        {detailed && <div className="sm:col-span-2"><AssetAutocomplete value={selectedAsset.ticker} assets={assetsMaster} onChange={(ticker) => setSelectedAsset((current) => ({ ...current, ticker }))} onSelect={(asset) => { setSelectedAsset(asset); setForm((current) => ({ ...current, sector: asset.sector || current.sector })); }} /></div>}
        <label className="form-label">Cotacao atual<input autoFocus={!detailed} required inputMode="decimal" name="currentQuote" type="number" min="0" step="any" value={form.currentQuote} onChange={update} className="field mt-2" /></label>
        <label className="form-label">Data de atualizacao<input required name="updatedAt" type="date" value={form.updatedAt} onChange={update} className="field mt-2" /></label>
        {detailed && <><label className="form-label sm:col-span-2">Setor <span className="text-[#555b56]">(opcional)</span><input name="sector" maxLength={60} value={form.sector} onChange={update} className="field mt-2" /></label><label className="form-label sm:col-span-2">Observacoes <span className="text-[#555b56]">(opcional)</span><textarea name="notes" maxLength={240} rows={3} value={form.notes} onChange={update} className="field mt-2 resize-none" /></label></>}
        {error && <p role="alert" className="text-sm text-rose-400 sm:col-span-2">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            {onClear && quote?.manualPrice ? <button type="button" onClick={() => { if (window.confirm(`Limpar cotacao manual de ${selectedAsset.ticker}?`)) onClear(selectedAsset.ticker); }} className="px-5 py-3 text-sm font-bold text-rose-400">Limpar manual</button> : null}
            {onUseAutomatic && quote?.automaticPrice ? <button type="button" onClick={() => onUseAutomatic(selectedAsset.ticker)} className="px-5 py-3 text-sm font-bold text-[#d9b86c]">Usar automatica</button> : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="px-5 py-3 text-sm text-[#898e89]">Cancelar</button><button className="gold-button">Salvar manual</button></div>
        </div>
      </form>
    </div>
  </div>;
}
