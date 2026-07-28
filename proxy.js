import { NextResponse } from "next/server";
import { createProxySupabaseClient } from "./lib/supabase/client/serverClient.js";
import { getSafeRedirectPath } from "./lib/auth/authRedirects.js";

const PUBLIC_AUTH_ROUTES = new Set(["/entrar", "/cadastrar"]);

function isAccountRoute(pathname) {
  return pathname === "/conta" || pathname.startsWith("/conta/");
}

function loginRedirect(request) {
  const destination = new URL("/entrar", request.url);
  destination.searchParams.set(
    "next",
    getSafeRedirectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
  );
  return NextResponse.redirect(destination);
}

export async function proxy(request) {
  let response = NextResponse.next({ request });
  let authenticated = false;

  try {
    const proxyClient = createProxySupabaseClient(request, response, {
      createResponse: () => NextResponse.next({ request }),
    });
    const { data, error } = await proxyClient.supabase.auth.getClaims();
    authenticated = !error && Boolean(data?.claims?.sub);
    response = proxyClient.getResponse();
  } catch {
    authenticated = false;
  }

  if (isAccountRoute(request.nextUrl.pathname) && !authenticated) {
    return loginRedirect(request);
  }

  if (PUBLIC_AUTH_ROUTES.has(request.nextUrl.pathname) && authenticated) {
    return NextResponse.redirect(new URL("/conta", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
