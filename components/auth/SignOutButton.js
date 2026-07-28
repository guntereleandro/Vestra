"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeAuthResult, signOut } from "@/lib/auth/authService";

export default function SignOutButton() {
  const router = useRouter();
  const [state, setState] = useState({ submitting: false, error: "" });
  async function handleSignOut() {
    if (state.submitting) return;
    setState({ submitting: true, error: "" });
    try {
      await signOut();
      router.replace("/entrar");
      router.refresh();
    } catch (error) {
      setState({ submitting: false, error: normalizeAuthResult(error).message });
    }
  }
  return <div>
    <button type="button" onClick={handleSignOut} disabled={state.submitting} className="gold-button disabled:opacity-60">{state.submitting ? "Saindo..." : "Sair da conta"}</button>
    {state.error ? <p role="alert" className="mt-3 text-xs text-rose-300">{state.error}</p> : null}
  </div>;
}

