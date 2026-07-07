"use client";

import { useRef, useState } from "react";
import { Download, FileUp, ShieldAlert, Trash2, X } from "lucide-react";
import { clearVestraData, createBackup, restoreBackup, validateBackup } from "@/lib/data/storage";

export default function DataManagement() {
  const inputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearText, setClearText] = useState("");
  const [message, setMessage] = useState(null);

  function exportData() {
    try {
      const backup = createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `vestra-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Backup exportado com sucesso." });
    } catch { setMessage({ type: "error", text: "Não foi possível exportar os dados." }); }
  }

  async function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { const parsed = JSON.parse(await file.text()); validateBackup(parsed); setPendingImport(parsed); setMessage(null); }
    catch (error) { setMessage({ type: "error", text: error.message === "UNKNOWN_VERSION" ? "Versão de backup desconhecida." : error instanceof SyntaxError ? "O arquivo contém um JSON corrompido." : "Arquivo de backup inválido." }); }
  }

  function confirmImport() { try { restoreBackup(pendingImport); window.location.reload(); } catch { setPendingImport(null); setMessage({ type: "error", text: "Não foi possível restaurar este backup." }); } }
  function confirmClear() { if (clearText !== "LIMPAR") return; clearVestraData(); window.location.reload(); }

  return <><section className="card mt-6 rounded-2xl"><div className="border-b border-white/[.06] p-5 sm:p-6"><h2 className="font-display text-xl">Backup e dados locais</h2><p className="mt-1 text-xs text-[#777d78]">Exporte uma cópia ou restaure os dados deste navegador.</p></div><div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6"><button onClick={exportData} className="flex items-center justify-center gap-2 rounded-xl border border-[#d9b86c]/25 bg-[#d9b86c]/5 px-4 py-3 text-xs font-bold text-[#d9b86c]"><Download size={16} />Exportar dados</button><button onClick={() => inputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-[#c5c8c4]"><FileUp size={16} />Importar dados</button><button onClick={() => setClearOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 px-4 py-3 text-xs font-bold text-rose-400"><Trash2 size={16} />Limpar dados locais</button><input ref={inputRef} type="file" accept="application/json,.json" onChange={selectFile} className="hidden" /></div>{message && <p role="status" className={`px-5 pb-5 text-xs sm:px-6 ${message.type === "error" ? "text-rose-400" : "text-emerald-400"}`}>{message.text}</p>}</section>{pendingImport && <ConfirmModal title="Substituir dados atuais?" description="As operações, cotações e personalizações atuais serão substituídas pelo conteúdo do backup." onClose={() => setPendingImport(null)}><button onClick={() => setPendingImport(null)} className="px-5 py-3 text-sm text-[#898e89]">Cancelar</button><button onClick={confirmImport} className="gold-button">Importar e substituir</button></ConfirmModal>}{clearOpen && <ConfirmModal danger title="Limpar todos os dados?" description="Esta ação remove somente as chaves do Vestra e não pode ser desfeita." onClose={() => { setClearOpen(false); setClearText(""); }}><div className="w-full"><label className="form-label">Digite <strong className="text-rose-400">LIMPAR</strong> para confirmar<input autoFocus value={clearText} onChange={(event) => setClearText(event.target.value.toUpperCase())} className="field mt-2" /></label><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => { setClearOpen(false); setClearText(""); }} className="px-5 py-3 text-sm text-[#898e89]">Cancelar</button><button disabled={clearText !== "LIMPAR"} onClick={confirmClear} className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-30">Limpar permanentemente</button></div></div></ConfirmModal>}</>;
}

function ConfirmModal({ title, description, onClose, children, danger = false }) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div role="alertdialog" aria-modal="true" className="card w-full max-w-md rounded-2xl p-6"><div className="flex items-start justify-between gap-4"><span className={`grid h-11 w-11 place-items-center rounded-xl ${danger ? "bg-rose-500/10 text-rose-400" : "bg-[#d9b86c]/10 text-[#d9b86c]"}`}><ShieldAlert size={20} /></span><button onClick={onClose} aria-label="Fechar" className="icon-button"><X size={17} /></button></div><h2 className="font-display mt-5 text-2xl">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#898e89]">{description}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div></div></div>;
}
