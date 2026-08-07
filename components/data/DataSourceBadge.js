"use client";

import { Database, HardDrive } from "lucide-react";

export default function DataSourceBadge({ dataSource, sourceError, onUseLocal }) {
  if (sourceError) return <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div><p className="text-xs font-bold text-rose-300">Falha ao carregar a fonte selecionada</p><p className="mt-1 text-xs text-[#a0a5a0]">{sourceError.message}</p></div>
    {onUseLocal && <button className="btn-secondary shrink-0" onClick={onUseLocal} type="button">Usar Local neste dispositivo</button>}
  </div>;

  if (!dataSource) return <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[#898e89]" aria-label="Carregando fonte de dados">
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1.5 text-[#b7bbb7]">Carregando fonte...</span>
  </div>;

  const remote = dataSource?.source === "SUPABASE";
  const Icon = remote ? Database : HardDrive;
  return <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[#898e89]" aria-label={`Fonte de dados: ${remote ? "Supabase" : "Local"}`}>
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1.5 text-[#b7bbb7]"><Icon size={12} />Fonte: {remote ? `Supabase • ${dataSource.portfolioName}` : "Local"}</span>
    <span>{dataSource?.operationCount || 0} operação(ões)</span>
    {remote && <span>{dataSource.canWrite ? dataSource.role : `${dataSource.role} • somente leitura`}</span>}
  </div>;
}
