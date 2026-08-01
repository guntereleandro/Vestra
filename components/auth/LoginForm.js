"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthMessage from "./AuthMessage";
import { normalizeAuthResult, resolvePostAuthRedirect, signInWithPassword } from "@/lib/auth/authService";

export default function LoginForm({ next = "/dashboard" }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [state, setState] = useState({ submitting: false, error: "" });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (state.submitting) return;
    setState({ submitting: true, error: "" });
    try {
      await signInWithPassword(form);
      router.replace(resolvePostAuthRedirect(next));
      router.refresh();
    } catch (error) {
      setState({ submitting: false, error: normalizeAuthResult(error).message });
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="form-label block">E-mail<input className="field mt-2" name="email" type="email" autoComplete="email" inputMode="email" required value={form.email} onChange={update} /></label>
    <label className="form-label block">Senha<input className="field mt-2" name="password" type="password" autoComplete="current-password" required minLength={8} value={form.password} onChange={update} /></label>
    {state.error ? <AuthMessage>{state.error}</AuthMessage> : null}
    <div className="flex justify-end"><Link href="/recuperar-senha" className="text-xs text-[#d9b86c] hover:text-[#f0d99e]">Esqueci minha senha</Link></div>
    <button className="gold-button w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={state.submitting}>{state.submitting ? "Entrando..." : "Entrar"}</button>
  </form>;
}
