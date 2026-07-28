import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client/serverClient";
import { getSafeRedirectPath } from "@/lib/auth/authRedirects";

const ALLOWED_TYPES = new Set(["signup", "email", "recovery"]);

function errorRedirect(request, type) {
  const path = type === "recovery" ? "/atualizar-senha" : "/confirmar-email";
  const destination = new URL(path, request.url);
  destination.searchParams.set("status", "error");
  destination.searchParams.set("error", "RECOVERY_LINK_INVALID");
  return NextResponse.redirect(destination);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const requestedType = searchParams.get("type") || "";
  const type = ALLOWED_TYPES.has(requestedType) ? requestedType : "";
  let next = getSafeRedirectPath(searchParams.get("next"));

  if (type === "recovery") next = "/atualizar-senha";
  if ((!code && !tokenHash) || (tokenHash && !type)) return errorRedirect(request, type);

  try {
    const supabase = await createServerSupabaseClient();
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (result.error) return errorRedirect(request, type);
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return errorRedirect(request, type);
  }
}

