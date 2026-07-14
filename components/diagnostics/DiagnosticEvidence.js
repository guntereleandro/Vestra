export default function DiagnosticEvidence({ evidence, metrics, limitations }) {
  const evidenceItems = normalizeEvidence(evidence);
  const metricItems = normalizeEntries(metrics);
  const limitationItems = Array.isArray(limitations) ? limitations : [];

  return <div className="grid gap-5 text-xs leading-5 text-[#8d928d] md:grid-cols-3"><DetailGroup title="Evidências" items={evidenceItems} empty="Nenhuma evidência adicional." /><DetailGroup title="Métricas" items={metricItems} empty="Nenhuma métrica adicional." /><DetailGroup title="Limitações" items={limitationItems} empty="Nenhuma limitação específica." /></div>;
}

function DetailGroup({ title, items, empty }) {
  return <div className="min-w-0"><h4 className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#d9b86c]">{title}</h4>{items.length ? <ul className="space-y-1.5">{items.map((item, index) => <li className="break-words" key={`${item}-${index}`}>{item}</li>)}</ul> : <p>{empty}</p>}</div>;
}

function normalizeEvidence(value) {
  if (Array.isArray(value)) return value.map(formatValue);
  if (value && typeof value === "object") return normalizeEntries(value);
  return value == null ? [] : [formatValue(value)];
}

function normalizeEntries(value) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).map(([key, item]) => `${humanize(key)}: ${formatValue(item)}`);
}

function formatValue(value) {
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (value && typeof value === "object") return Object.entries(value).map(([key, item]) => `${humanize(key)} ${formatValue(item)}`).join(" · ");
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  if (typeof value === "boolean") return value ? "sim" : "não";
  return String(value ?? "não informado");
}

function humanize(value) { return String(value).replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase(); }
