import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "../config/supabaseConfig.js";

export function createAdminSupabaseClient(options = {}) {
  const config = requireSupabaseConfig({ admin: true, config: options.config });

  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
