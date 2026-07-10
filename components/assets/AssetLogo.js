"use client";

import { useState } from "react";

function initials(ticker, name) {
  const base = String(ticker || name || "?").trim();
  return base.slice(0, 2).toUpperCase();
}

export default function AssetLogo({ ticker, name, logoPath, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const sizes = { sm: "h-8 w-8 text-[9px]", md: "h-9 w-9 text-[10px]", lg: "h-14 w-14 text-sm" };
  const className = `${sizes[size] || sizes.md} grid shrink-0 place-items-center overflow-hidden rounded-lg border border-[#d9b86c]/15 bg-[#d9b86c]/5 font-bold text-[#d9b86c]`;
  const safeLogo = typeof logoPath === "string" && (logoPath.startsWith("/") || logoPath.startsWith("https://")) ? logoPath : "";
  if (safeLogo && !failed) return <span className={className}><img src={safeLogo} alt={`Logo ${ticker || name}`} className="h-full w-full object-cover" onError={() => setFailed(true)} /></span>;
  return <span className={className} aria-hidden="true">{initials(ticker, name)}</span>;
}
