import { AlertCircle, Clock3 } from "lucide-react";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatQuoteDate(value) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return dateFormatter.format(new Date(`${raw}T00:00:00Z`));
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? dateTimeFormatter.format(date) : raw;
}

export default function QuoteInfo({ hasQuote, updatedAt, origin, stale, manualOverride }) {
  if (!hasQuote) return <p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-400"><AlertCircle size={12} />Cotacao nao informada</p>;
  return <div className="mt-1 space-y-0.5 text-[9px] text-[#777d78]">
    <p className="flex items-center gap-1"><Clock3 size={11} />{updatedAt ? formatQuoteDate(updatedAt) : "Data nao informada"}</p>
    <p>Origem: {origin || "manual"}{manualOverride ? " · manual prevalecendo" : ""}{stale ? " · desatualizada" : ""}</p>
  </div>;
}
