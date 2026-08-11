"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { brandConfig } from "@/lib/config/brandConfig";

export default function CommandSearch({ value, onChange, onKeyDown }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return <label className="relative block">
    <span className="sr-only">Pesquisar comando</span>
    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#626762]" size={17} />
    <input ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} className="field-with-prefix-icon w-full border-0 border-b border-white/[.06] bg-transparent py-5 pr-4 text-sm text-white outline-none placeholder:text-[#555b56]" placeholder={`Pesquisar no ${brandConfig.appName}...`} />
  </label>;
}
