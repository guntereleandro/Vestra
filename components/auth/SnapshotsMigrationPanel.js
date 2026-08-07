"use client";

import { useState } from "react";
import { importLocalSnapshots, previewLocalSnapshotsImport } from "@/lib/services/snapshotsMigrationService";

export default function SnapshotsMigrationPanel() {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  async function inspect() {
    setStatus("loading"); setMessage("");
    try { setPreview(await previewLocalSnapshotsImport()); setStatus("ready"); }
    catch { setStatus("error"); setMessage("Não foi possível comparar os históricos agora."); }
  }
  async function importSnapshots() {
    setStatus("loading"); setMessage("");
    try {
      const result = await importLocalSnapshots({ confirmed: true });
      setPreview(await previewLocalSnapshotsImport()); setStatus("ready");
      setMessage(`${result.imported} snapshot(s) importado(s). O histórico Local foi preservado.`);
    } catch { setStatus("error"); setMessage("Não foi possível importar o histórico."); }
  }
  return <section className="mt-6 rounded-2xl border border-white/[.06] p-5">
    <p className="eyebrow">Histórico patrimonial</p><h3 className="font-display mt-2 text-xl text-white">Importar snapshots locais</h3>
    <p className="mt-2 text-sm leading-relaxed text-[#898e89]">A importação é manual, preserva este navegador e nunca substitui silenciosamente datas remotas divergentes.</p>
    {!preview ? <button className="btn-secondary mt-4" disabled={status === "loading"} onClick={inspect} type="button">{status === "loading" ? "Comparando..." : "Gerar prévia"}</button> : <div className="mt-4 text-sm text-[#b7bbb7]">
      <p>{preview.localCount} local(is), {preview.remoteCount} remoto(s), {preview.missing.length} novo(s) e {preview.conflicts.length} conflito(s).</p>
      {preview.period && <p className="mt-1 text-xs text-[#777d78]">Período: {preview.period.start} a {preview.period.end}.</p>}
      {preview.conflicts.length > 0 && <p className="mt-2 text-xs text-amber-300">Conflitos: {preview.conflicts.map((item) => item.date).join(", ")}. Essas datas não serão sobrescritas.</p>}
      <div className="mt-4 flex flex-wrap gap-2"><button className="btn-secondary" disabled={status === "loading"} onClick={inspect} type="button">Atualizar prévia</button><button className="btn-primary" disabled={status === "loading" || !preview.missing.length || !["owner", "editor"].includes(preview.portfolio.role)} onClick={importSnapshots} type="button">Confirmar importação</button></div>
    </div>}
    {message && <p className="mt-3 text-sm text-[#b7bbb7]" role="status">{message}</p>}
  </section>;
}
