"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import GoalIcon from "@/components/goals/GoalIcon";
import { GOAL_TYPES, isAutomaticGoal } from "@/lib/data/goals";

export default function GoalFormModal({ goal, onClose, onSave }) {
  const [title, setTitle] = useState(goal?.title || "");
  const [type, setType] = useState(goal?.type || "patrimony");
  const [targetValue, setTargetValue] = useState(goal?.targetValue || "");
  const [manualCurrent, setManualCurrent] = useState(goal?.manualCurrent || "");
  const [description, setDescription] = useState(goal?.description || "");
  const [dueDate, setDueDate] = useState(goal?.dueDate || "");
  const selectedType = useMemo(() => GOAL_TYPES.find((item) => item.id === type) || GOAL_TYPES[0], [type]);
  const automatic = isAutomaticGoal(type);

  function submit(event) {
    event.preventDefault();
    onSave({ ...goal, title, type, targetValue, manualCurrent, description, dueDate, updatedAt: new Date().toISOString() });
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="card w-full max-w-2xl rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{goal ? "Editar objetivo" : "Novo objetivo"}</p>
          <h2 className="font-display mt-2 text-2xl">Transforme patrimônio em direção</h2>
        </div>
        <button type="button" onClick={onClose} className="icon-button" aria-label="Fechar"><X size={18} /></button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="form-label">Título</span><input required value={title} onChange={(event) => setTitle(event.target.value)} className="field mt-2" placeholder="Ex.: Reserva de segurança" /></label>
        <label><span className="form-label">Tipo</span><select value={type} onChange={(event) => setType(event.target.value)} className="field mt-2">{GOAL_TYPES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="rounded-2xl border border-white/[.06] bg-white/[.018] p-4">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.08]"><GoalIcon icon={selectedType.icon} color={selectedType.color} /></span><div><p className="text-sm font-semibold text-white">{selectedType.name}</p><p className="text-xs text-[#777d78]">{selectedType.meta}</p></div></div>
        </div>
        <label><span className="form-label">Valor alvo</span><input required min="0.01" step="0.01" type="number" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="field mt-2" /></label>
        <label><span className="form-label">Data opcional</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="field mt-2" /></label>
        {!automatic ? <label className="sm:col-span-2"><span className="form-label">Progresso atual manual</span><input min="0" step="0.01" type="number" value={manualCurrent} onChange={(event) => setManualCurrent(event.target.value)} className="field mt-2" /></label> : null}
        <label className="sm:col-span-2"><span className="form-label">Descrição opcional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="field mt-2 resize-none" placeholder="Uma frase curta sobre este objetivo." /></label>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="px-5 py-3 text-sm text-[#898e89]">Cancelar</button>
        <button className="gold-button">{goal ? "Salvar objetivo" : "Criar objetivo"}</button>
      </div>
    </form>
  </div>;
}
