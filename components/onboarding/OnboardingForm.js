"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeRemoteOnboarding } from "@/lib/services/accountCoreService";
import { getSafeRedirectPath } from "@/lib/auth/authRedirects";

const TIMEZONES = [
  ["America/Sao_Paulo", "Brasilia (UTC-3)"],
  ["America/Manaus", "Manaus (UTC-4)"],
  ["America/Rio_Branco", "Rio Branco (UTC-5)"],
];

export default function OnboardingForm({ next = "/dashboard" }) {
  const router = useRouter();
  const [form, setForm] = useState({ portfolioName: "Minha carteira", currency: "BRL", timezone: "America/Sao_Paulo" });
  const [state, setState] = useState({ saving: false, error: "" });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (state.saving || !form.portfolioName.trim()) return;
    setState({ saving: true, error: "" });
    try {
      await completeRemoteOnboarding(form);
      router.replace(getSafeRedirectPath(next, "/dashboard"));
      router.refresh();
    } catch {
      setState({ saving: false, error: "Nao foi possivel concluir a configuracao agora. Tente novamente." });
    }
  }

  return <form className="mt-8 space-y-5" onSubmit={submit}>
    <label className="form-label block">Nome da carteira<input className="field mt-2" name="portfolioName" maxLength={120} required value={form.portfolioName} onChange={update} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="form-label block">Moeda<select className="field mt-2" name="currency" value={form.currency} onChange={update}><option value="BRL">Real brasileiro (BRL)</option><option value="USD">Dolar americano (USD)</option><option value="EUR">Euro (EUR)</option></select></label>
      <label className="form-label block">Fuso horario<select className="field mt-2" name="timezone" value={form.timezone} onChange={update}>{TIMEZONES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {state.error && <p className="text-sm text-rose-300" role="alert">{state.error}</p>}
    <button className="gold-button w-full py-3.5 disabled:opacity-60" disabled={state.saving}>{state.saving ? "Concluindo..." : "Concluir e acessar"}</button>
  </form>;
}
