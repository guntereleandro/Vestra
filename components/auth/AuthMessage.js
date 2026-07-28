export default function AuthMessage({ children, tone = "error" }) {
  const styles = tone === "success"
    ? "border-emerald-400/20 bg-emerald-400/[.07] text-emerald-200"
    : "border-rose-400/20 bg-rose-400/[.07] text-rose-200";
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${styles}`}>{children}</p>;
}

