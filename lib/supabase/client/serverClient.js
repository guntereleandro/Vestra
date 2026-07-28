import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseConfig } from "../config/supabaseConfig.js";

function cookieAdapter(cookieStore) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components não podem gravar cookies. O futuro proxy de sessão fará a renovação.
      }
    },
  };
}

function proxyCookieAdapter(request, responseState) {
  return {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      for (const { name, value } of cookiesToSet) {
        request.cookies.set(name, value);
      }
      if (responseState.create) responseState.current = responseState.create();
      for (const { name, value, options } of cookiesToSet) {
        responseState.current.cookies.set(name, value, options);
      }
    },
  };
}

export async function createServerSupabaseClient(options = {}) {
  const config = requireSupabaseConfig({ config: options.config });
  const cookieStore = options.cookieStore || await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: cookieAdapter(cookieStore),
  });
}

export function createProxySupabaseClient(request, response, options = {}) {
  const config = requireSupabaseConfig({ config: options.config });
  const responseState = { current: response, create: options.createResponse };
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: proxyCookieAdapter(request, responseState),
  });

  return {
    supabase,
    getResponse() {
      return responseState.current;
    },
  };
}
