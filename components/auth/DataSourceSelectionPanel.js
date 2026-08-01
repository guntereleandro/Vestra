"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DATA_SOURCE,
  getDataSourceErrorMessage,
  getDataSourceSelectionStatus,
  selectPortfolioDataSource,
} from "@/lib/services/dataSourceResolver";
import { previewOperationsMigration } from "@/lib/services/operationsMigrationService";

export default function DataSourceSelectionPanel() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setStatus("loading"); setMessage("");
    try {
      const [selection, comparison] = await Promise.all([getDataSourceSelectionStatus(), previewOperationsMigration()]);
      setData({ ...selection, comparison }); setStatus("ready");
    } catch (error) { setStatus("error"); setMessage(getDataSourceErrorMessage(error)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function choose(source) {
    if (source === DATA_SOURCE.SUPABASE && !window.confirm("Usar os dados da carteira remota nos cálculos e operações? Nenhum dado local será apagado.")) return;
    setStatus("saving"); setMessage("");
    try { await selectPortfolioDataSource(source); await load(); setMessage(`Fonte alterada para ${source === DATA_SOURCE.LOCAL ? "Local" : "Supabase"}.`); }
    catch (error) { setStatus("error"); setMessage(getDataSourceErrorMessage(error)); }
  }

  const conflicts = data?.comparison?.divergent?.length || 0;
  const financial = data?.comparison?.financial;
  return <section className="mt-7 border-t border-white/[.06] pt-6">
    <p className="eyebrow">Fonte operacional</p><h3 className="font-display mt-2 text-xl text-white">Local ou Supabase</h3>
    <p className="mt-2 text-sm text-[#898e89]">Apenas uma fonte alimenta a engine por vez. A troca nunca combina nem copia listas automaticamente.</p>
    {status === "loading" && <p className="mt-4 text-sm text-[#898e89]">Verificando fontes...</p>}
    {data && <div className="mt-4 rounded-2xl border border-white/[.06] bg-white/[.018] p-4">
      <div className="grid gap-2 text-xs text-[#898e89] sm:grid-cols-2">
        <span>Fonte atual: <b className="text-white">{data.selectedSource === DATA_SOURCE.SUPABASE ? "Supabase" : "Local"}</b></span>
        <span>Carteira: <b className="text-white">{data.portfolio.name}</b></span>
        <span>Local: {data.localOperationCount} operação(ões)</span><span>Supabase: {data.remoteOperationCount} operação(ões)</span>
        <span>Status: {conflicts ? `${conflicts} conflito(s) conhecido(s)` : "sem conflitos de ID conhecidos"}</span>
        <span>Comparação financeira: {financial?.totalsEquivalent ? "equivalente" : "divergente"}</span>
        <span>Última atualização remota: {data.remoteUpdatedAt ? new Date(data.remoteUpdatedAt).toLocaleString("pt-BR") : "sem operações"}</span>
        <span>Permissão: {data.portfolio.role}{!data.canWrite ? " • somente leitura" : ""}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={status === "saving" || data.selectedSource === DATA_SOURCE.LOCAL || !data.canWrite} onClick={() => choose(DATA_SOURCE.LOCAL)}>Usar Local</button>
        <button className="btn-primary" disabled={status === "saving" || data.selectedSource === DATA_SOURCE.SUPABASE || !data.canWrite} onClick={() => choose(DATA_SOURCE.SUPABASE)}>Usar Supabase</button>
      </div>
    </div>}
    {message && <p className={`mt-3 text-sm ${status === "error" ? "text-rose-400" : "text-[#b7bbb7]"}`} role="status">{message}</p>}
  </section>;
}
