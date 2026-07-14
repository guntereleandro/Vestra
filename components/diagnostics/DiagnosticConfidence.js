const levels = [
  { minimum: 0.75, label: "Confiança alta" },
  { minimum: 0.4, label: "Confiança média" },
  { minimum: 0, label: "Confiança baixa" },
];

export default function DiagnosticConfidence({ value }) {
  const confidence = Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : 0;
  const level = levels.find((item) => confidence >= item.minimum);
  return <span className="inline-flex rounded-full border border-white/[.08] bg-white/[.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#9ba09b]" aria-label={`${level.label}, ${Math.round(confidence * 100)} por cento`}>{level.label} · {Math.round(confidence * 100)}%</span>;
}
