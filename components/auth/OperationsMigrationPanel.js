"use client";

import { useState } from "react";
import { brandConfig } from "@/lib/config/brandConfig";
import {
  createOperationsSafetyBackup,
  getOperationsMigrationErrorMessage,
  importSafeLocalOperations,
  previewOperationsMigration,
} from "@/lib/services/operationsMigrationService";

function downloadSafetyBackup() {
  const backup = createOperationsSafetyBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${brandConfig.backupFilePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OperationsMigrationPanel() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function inspect() {
    setStatus("loading");
    setMessage("");
    setResult(null);
    try {
      setPreview(await previewOperationsMigration());
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(getOperationsMigrationErrorMessage(error));
    }
  }

  async function importOperations() {
    setStatus("importing");
    setMessage("");
    downloadSafetyBackup();
    try {
      const report = await importSafeLocalOperations();
      setResult(report);
      setPreview(await previewOperationsMigration());
      setStatus("done");
      setMessage(report.status === "COMPLETED"
        ? `${report.imported} operação(ões) importada(s) com segurança.`
        : "Nenhuma operação nova precisava ser importada.");
    } catch (error) {
      setStatus("error");
      setMessage(`${getOperationsMigrationErrorMessage(error)} Os dados locais foram preservados.`);
    }
  }

  return <section className="mt-7 border-t border-white/[.06] pt-6">
    <p className="eyebrow">Operações</p>
    <h3 className="font-display mt-2 text-xl text-white">Importação segura</h3>
    <p className="mt-2 text-sm leading-relaxed text-[#898e89]">
      Compare este navegador com a carteira remota. Nada é excluído ou sobrescrito quando existe divergência.
    </p>
    <button className="btn-secondary mt-4" disabled={status === "loading" || status === "importing"} onClick={inspect}>
      {status === "loading" ? "Comparando..." : "Verificar dados"}
    </button>

    {preview && <div className="mt-4 rounded-2xl border border-white/[.06] bg-white/[.018] p-4">
      <p className="text-sm font-semibold text-white">{preview.portfolio.name}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#898e89] sm:grid-cols-4">
        <span>Somente local: {preview.onlyLocal.length}</span>
        <span>Somente remoto: {preview.onlyRemote.length}</span>
        <span>Iguais: {preview.equal.length}</span>
        <span>Conflitos: {preview.divergent.length}</span>
      </div>
      {preview.invalid.length > 0 && <p className="mt-3 text-xs text-rose-400">
        {preview.invalid.length} registro(s) local(is) inválido(s). Corrija-os antes de importar.
      </p>}
      {preview.divergent.length > 0 && <p className="mt-3 text-xs text-amber-300">
        IDs divergentes não serão sobrescritos: {preview.divergent.map((item) => item.ticker).join(", ")}.
      </p>}
      {preview.canImport && <button className="btn-primary mt-4" disabled={status === "importing"} onClick={importOperations}>
        {status === "importing" ? "Importando..." : "Baixar backup e importar registros seguros"}
      </button>}
    </div>}
    {result?.divergent > 0 && <p className="mt-3 text-xs text-amber-300">
      {result.divergent} conflito(s) permaneceram sem alteração.
    </p>}
    {message && <p className="mt-3 text-sm text-[#b7bbb7]" role="status">{message}</p>}
  </section>;
}
