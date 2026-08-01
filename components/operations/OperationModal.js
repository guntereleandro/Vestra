"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ASSET_TYPES } from "@/lib/data/assetsMaster";
import { createOperationId, EMPTY_OPERATION, OPERATION_TYPES, isIncomeOperation } from "@/lib/data/operations";
import { calculateAssetPosition } from "@/lib/engine/portfolio";
import { currency } from "@/lib/engine/totals";
import { safeNumber } from "@/lib/engine/validations";
import AssetAutocomplete from "@/components/assets/AssetAutocomplete";

export default function OperationModal({ operation, operations, assetsMaster, onClose, onSave }) {
  const [form, setForm] = useState(operation || { ...EMPTY_OPERATION, date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const income = isIncomeOperation(form.operationType);
  const tradeTotal = useMemo(() => form.operationType === "COMPRA" ? safeNumber(form.quantity) * safeNumber(form.unitPrice) + safeNumber(form.fees) : Math.max(0, safeNumber(form.quantity) * safeNumber(form.unitPrice) - safeNumber(form.fees)), [form.operationType, form.quantity, form.unitPrice, form.fees]);

  useEffect(() => { const close = (event) => event.key === "Escape" && onClose(); document.addEventListener("keydown", close); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; }; }, [onClose]);
  const update = (event) => { setError(""); setForm((current) => ({ ...current, [event.target.name]: event.target.value })); };
  const selectAsset = (asset) => setForm((current) => ({ ...current, ticker: asset.ticker, assetName: asset.name, assetType: asset.type }));

  async function submit(event) {
    event.preventDefault();
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker || !form.assetName.trim() || !form.date) return setError("Preencha ticker, nome do ativo e data.");
    if (income && safeNumber(form.totalValue) <= 0) return setError("Informe um valor de provento maior que zero.");
    if (!income && (safeNumber(form.quantity) <= 0 || safeNumber(form.unitPrice) < 0)) return setError("Informe uma quantidade maior que zero e um preço válido.");
    if (form.operationType === "VENDA") {
      const otherOperations = operations.filter((item) => item.id !== operation?.id && item.ticker === ticker);
      const position = calculateAssetPosition(otherOperations, 0);
      if (!position || safeNumber(form.quantity) > position.quantity) return setError(`Quantidade disponível para venda: ${position?.quantity || 0}.`);
    }
    const result = await onSave({ id: operation?.id || createOperationId(), ticker, assetName: form.assetName.trim(), assetType: form.assetType, operationType: form.operationType, date: form.date, quantity: income ? 0 : safeNumber(form.quantity), unitPrice: income ? 0 : safeNumber(form.unitPrice), fees: safeNumber(form.fees), totalValue: income ? safeNumber(form.totalValue) : tradeTotal, notes: form.notes.trim() });
    if (!result?.ok) setError(`Nao foi possivel salvar a operacao${result?.error?.code ? ` (${result.error.code})` : ""}.`);
  }

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div role="dialog" aria-modal="true" aria-labelledby="operation-title" className="card max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-3xl sm:rounded-3xl sm:p-7"><div className="mb-6 flex items-center justify-between"><div><p className="eyebrow">Movimentação</p><h2 id="operation-title" className="font-display mt-1 text-2xl">{operation ? "Editar operação" : "Nova operação"}</h2></div><button onClick={onClose} aria-label="Fechar" className="icon-button"><X size={18} /></button></div><form onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><AssetAutocomplete autoFocus value={form.ticker} assets={assetsMaster} onChange={(ticker) => setForm((current) => ({ ...current, ticker }))} onSelect={selectAsset} /><label className="form-label sm:col-span-1 lg:col-span-2">Nome do ativo<input required maxLength={80} name="assetName" value={form.assetName} onChange={update} placeholder="Ex.: Petrobras" className="field mt-2" /></label><label className="form-label">Tipo do ativo<select name="assetType" value={form.assetType} onChange={update} className="field mt-2">{ASSET_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label className="form-label">Tipo da operação<select name="operationType" value={form.operationType} onChange={update} className="field mt-2">{OPERATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label className="form-label">Data<input required name="date" type="date" value={form.date} onChange={update} className="field mt-2" /></label>{!income && <><label className="form-label">Quantidade<input required inputMode="decimal" name="quantity" type="number" min="0.00000001" step="any" value={form.quantity} onChange={update} className="field mt-2" /></label><label className="form-label">Preço unitário<input required inputMode="decimal" name="unitPrice" type="number" min="0" step="any" value={form.unitPrice} onChange={update} className="field mt-2" /></label></>}<label className="form-label">Taxas<input inputMode="decimal" name="fees" type="number" min="0" step="any" value={form.fees} onChange={update} className="field mt-2" /></label>{income ? <label className="form-label">Valor recebido<input required inputMode="decimal" name="totalValue" type="number" min="0.01" step="any" value={form.totalValue} onChange={update} className="field mt-2" /></label> : <div className="rounded-xl border border-[#d9b86c]/15 bg-[#d9b86c]/5 p-3"><p className="text-[10px] uppercase tracking-[.14em] text-[#777d78]">Valor total</p><p className="mt-1 font-semibold text-[#e4cf98]">{currency.format(tradeTotal)}</p></div>}<label className="form-label sm:col-span-2 lg:col-span-3">Observações<textarea name="notes" maxLength={240} rows={3} value={form.notes} onChange={update} placeholder="Informações opcionais sobre a operação" className="field mt-2 resize-none" /></label></div>{error && <p role="alert" className="mt-4 text-sm text-rose-400">{error}</p>}<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="px-5 py-3 text-sm text-[#898e89]">Cancelar</button><button className="gold-button">{operation ? "Salvar alterações" : "Registrar operação"}</button></div></form></div></div>;
}
