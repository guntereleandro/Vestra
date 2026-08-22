import { NextResponse } from "next/server";
import { createProxySupabaseClient } from "./lib/supabase/client/serverClient.js";
import { getSafeRedirectPath } from "./lib/auth/authRedirects.js";

const PUBLIC_AUTH_ROUTES = new Set(["/entrar", "/cadastrar"]);
const PUBLIC_EXACT_ROUTES = new Set(["/", "/entrar", "/cadastrar", "/recuperar-senha", "/atualizar-senha", "/confirmar-email"]);

function isPublicRoute(pathname) {
  return PUBLIC_EXACT_ROUTES.has(pathname)
    || pathname.startsWith("/mercado")
    || pathname.startsWith("/api/market")
    || pathname.startsWith("/auth/callback");
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
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/mercado") || pathname.startsWith("/api/market")) {
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });
  let authenticated = false;
  let hasPortfolio = null;

  try {
    const proxyClient = createProxySupabaseClient(request, response, {
      createResponse: () => NextResponse.next({ request }),
    });
    const { data, error } = await proxyClient.supabase.auth.getClaims();
    authenticated = !error && Boolean(data?.claims?.sub);
    if (authenticated) {
      const { data: memberships, error: membershipError } = await proxyClient.supabase
        .from("portfolio_members")
        .select("portfolio_id")
        .limit(1);
      if (!membershipError) hasPortfolio = Boolean(memberships?.length);
      if (hasPortfolio === false) {
        const { error: userError } = await proxyClient.supabase.auth.getUser();
        if (userError) {
          await proxyClient.supabase.auth.signOut();
          authenticated = false;
          hasPortfolio = null;
        }
      }
    }
    response = proxyClient.getResponse();
  } catch {
    authenticated = false;
  }

  if (!isPublicRoute(pathname) && !authenticated) {
    return loginRedirect(request);
  }

  if (authenticated && hasPortfolio === false && pathname !== "/onboarding" && !pathname.startsWith("/api/")) {
    const destination = new URL("/onboarding", request.url);
    if (!isPublicRoute(pathname) || PUBLIC_AUTH_ROUTES.has(pathname) || pathname === "/") {
      const intendedPath = isPublicRoute(pathname) ? "/dashboard" : `${pathname}${request.nextUrl.search}`;
      destination.searchParams.set("next", getSafeRedirectPath(intendedPath, "/dashboard"));
      return NextResponse.redirect(destination);
    }
  }

  if (authenticated && hasPortfolio && (PUBLIC_AUTH_ROUTES.has(pathname) || pathname === "/" || pathname === "/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
