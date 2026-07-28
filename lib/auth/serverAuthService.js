import "server-only";

import { createServerSupabaseClient } from "../supabase/client/serverClient.js";
import { AUTH_ERROR_CODES, authError, normalizeAuthError } from "./authErrors.js";

export async function getServerAuthUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user || null;
  } catch (error) {
    if (error?.code === "SUPABASE_CONFIG_MISSING") {
      throw authError(AUTH_ERROR_CODES.AUTH_NOT_CONFIGURED, { cause: error });
    }
    throw normalizeAuthError(error, AUTH_ERROR_CODES.SESSION_EXPIRED);
  }
}

