"use client";

import { useState } from "react";
import AuthMessage from "./AuthMessage";
import { normalizeAuthResult, updatePassword } from "@/lib/auth/authService";

export default function UpdatePasswordForm() {
  const [form, setForm] = useState({ password: "", passwordConfirmation: "" });
  const [state, setState] = useState({ submitting: false, error: "", updated: false });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (state.submitting) return;
    setState({ submitting: true, error: "", updated: false });
    try {
      await updatePassword(form);
      setForm({ password: "", passwordConfirmation: "" });
      setState({ submitting: false, error: "", updated: true });
    } catch (error) {
      setState({ submitting: false, error: normalizeAuthResult(error).message, updated: false });
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="form-label block">Nova senha<input className="field mt-2" name="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update} /></label>
    <label className="form-label block">Confirmar nova senha<input className="field mt-2" name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={8} value={form.passwordConfirmation} onChange={update} /></label>
    {state.error ? <AuthMessage>{state.error}</AuthMessage> : null}
    {state.updated ? <AuthMessage tone="success">Senha atualizada. Sua sessão atual foi mantida.</AuthMessage> : null}
    <button className="gold-button w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={state.submitting}>{state.submitting ? "Atualizando..." : "Definir nova senha"}</button>
  </form>;
}

