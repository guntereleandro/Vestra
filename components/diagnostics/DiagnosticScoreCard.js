import DiagnosticConfidence from "@/components/diagnostics/DiagnosticConfidence";

export default function DiagnosticScoreCard({ title, score, summary }) {
  const value = Number.isFinite(Number(score?.value)) ? Math.min(100, Math.max(0, Math.round(Number(score.value)))) : 0;
  const label = value >= 70 ? "Faixa elevada" : value >= 40 ? "Faixa moderada" : "Faixa baixa";
  const limitations = Array.isArray(score?.limitations) ? score.limitations : [];

  return <article className="card min-w-0 rounded-2xl p-5" aria-label={`${title}: ${value} de 100, ${label}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#c8cbc7]">{title}</p><p className="mt-3 text-3xl font-semibold tabular-nums text-[#f1e4bd]">{value}<span className="ml-1 text-sm font-normal text-[#666c67]">/100</span></p></div><span className="rounded-full bg-[#d9b86c]/[.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#d9b86c]">{label}</span></div><div className="mt-4"><DiagnosticConfidence value={score?.confidence} /></div><p className="mt-4 text-xs leading-5 text-[#858b86]">{summary}</p>{limitations.length > 0 && <ul className="mt-4 space-y-1.5 border-t border-white/[.06] pt-3 text-[11px] leading-4 text-[#6f7570]">{limitations.map((item) => <li key={item}>Limitação: {item}</li>)}</ul>}</article>;
}
