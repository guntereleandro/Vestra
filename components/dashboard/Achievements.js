"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { brandConfig } from "@/lib/config/brandConfig";

export default function Achievements({ achievements }) {
  const unlocked = achievements.filter((item) => item.unlocked).length;
  return <section className="card overflow-hidden rounded-2xl">
    <div className="flex flex-col gap-3 border-b border-white/[.06] p-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">Conquistas</p>
        <h2 className="font-display mt-2 text-2xl">Marcos da carteira</h2>
        <p className="mt-2 text-sm text-[#777d78]">Pequenos sinais do progresso registrado no {brandConfig.appName}.</p>
      </div>
      <p className="text-xs font-semibold text-[#a0a5a0]">{unlocked} de {achievements.length}</p>
    </div>
    <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-5">
      {achievements.map((item) => {
        const Icon = item.unlocked ? CheckCircle2 : Circle;
        return <article key={item.key} className={`rounded-xl border p-3 transition duration-300 hover:-translate-y-0.5 ${item.unlocked ? "border-[#d9b86c]/20 bg-[#d9b86c]/10 text-[#f0d99e]" : "border-white/[.05] bg-white/[.012] text-[#626762]"}`}>
          <div className="flex items-center gap-2">
            <Icon size={15} />
            <p className="text-xs font-semibold">{item.title}</p>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
