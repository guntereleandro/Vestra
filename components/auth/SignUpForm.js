"use client";

import { useState } from "react";
import AuthMessage from "./AuthMessage";
import { normalizeAuthResult, signUpWithPassword } from "@/lib/auth/authService";

export default function SignUpForm() {
  const [form, setForm] = useState({ email: "", password: "", passwordConfirmation: "" });
  const [state, setState] = useState({ submitting: false, error: "", sent: false });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (state.submitting) return;
    setState({ submitting: true, error: "", sent: false });
    try {
      await signUpWithPassword(form);
      setForm({ email: "", password: "", passwordConfirmation: "" });
      setState({ submitting: false, error: "", sent: true });
    } catch (error) {
      setState({ submitting: false, error: normalizeAuthResult(error).message, sent: false });
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="form-label block">E-mail<input className="field mt-2" name="email" type="email" autoComplete="email" inputMode="email" required value={form.email} onChange={update} /></label>
    <label className="form-label block">Senha<input className="field mt-2" name="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update} /></label>
    <label className="form-label block">Confirmar senha<input className="field mt-2" name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={8} value={form.passwordConfirmation} onChange={update} /></label>
    {state.error ? <AuthMessage>{state.error}</AuthMessage> : null}
    {state.sent ? <AuthMessage tone="success">Cadastro recebido. Verifique seu e-mail para confirmar a conta antes de entrar.</AuthMessage> : null}
    <button className="gold-button w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={state.submitting}>{state.submitting ? "Criando conta..." : "Criar conta"}</button>
    <p className="text-center text-[11px] leading-relaxed text-[#626862]">Nesta fase, criar uma conta não envia nem associa os dados da sua carteira local.</p>
  </form>;
}

