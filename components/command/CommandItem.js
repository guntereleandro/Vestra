"use client";

export default function CommandItem({ command, active, onSelect }) {
  const Icon = command.icon;
  return <button type="button" onClick={onSelect} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active ? "bg-[#d9b86c]/10 text-white" : "text-[#c9cbc7] hover:bg-white/[.035] hover:text-white"}`}>
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${active ? "border-[#d9b86c]/30 text-[#d9b86c]" : "border-white/[.07] text-[#898e89]"}`}>{Icon ? <Icon size={17} /> : null}</span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold">{command.title}</span>
      <span className="mt-0.5 block truncate text-[11px] text-[#777d78]">{command.subtitle}</span>
    </span>
    <span className="rounded-md border border-white/[.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#626762]">{command.group}</span>
  </button>;
}
