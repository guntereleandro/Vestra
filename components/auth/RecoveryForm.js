"use client";

import { useState } from "react";
import AuthMessage from "./AuthMessage";
import { normalizeAuthResult, requestPasswordRecovery } from "@/lib/auth/authService";

export default function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ submitting: false, error: "", sent: false });

  async function submit(event) {
    event.preventDefault();
    if (state.submitting) return;
    setState({ submitting: true, error: "", sent: false });
    try {
      await requestPasswordRecovery(email);
      setState({ submitting: false, error: "", sent: true });
    } catch (error) {
      const normalized = normalizeAuthResult(error);
      if (normalized.code === "AUTH_RATE_LIMITED" || normalized.code === "AUTH_NOT_CONFIGURED") {
        setState({ submitting: false, error: normalized.message, sent: false });
      } else {
        setState({ submitting: false, error: "", sent: true });
      }
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="form-label block">E-mail<input className="field mt-2" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    {state.error ? <AuthMessage>{state.error}</AuthMessage> : null}
    {state.sent ? <AuthMessage tone="success">Se o endereço estiver habilitado, você receberá as instruções para redefinir a senha.</AuthMessage> : null}
    <button className="gold-button w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={state.submitting}>{state.submitting ? "Enviando..." : "Enviar instruções"}</button>
  </form>;
}

