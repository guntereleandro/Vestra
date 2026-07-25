import "server-only";

import { publicEnvConfig } from "./publicEnvConfig.js";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalUrl(value) {
  const normalized = clean(value);
  if (!normalized) return "";
  try {
    return new URL(normalized).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export const privateEnvConfig = Object.freeze({
  supabaseUrl: optionalUrl(process.env.SUPABASE_URL),
  supabaseAnonKey: clean(process.env.SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  brapiToken: clean(process.env.BRAPI_TOKEN),
});

export const envConfig = Object.freeze({
  public: publicEnvConfig,
  private: privateEnvConfig,
});

export function getServerEnvDiagnostics() {
  return {
    public: {
      appEnvironment: publicEnvConfig.appEnvironment,
      hasAppUrl: Boolean(publicEnvConfig.appUrl),
      hasSiteUrl: Boolean(publicEnvConfig.siteUrl),
    },
    private: {
      hasSupabaseUrl: Boolean(privateEnvConfig.supabaseUrl),
      hasSupabaseAnonKey: Boolean(privateEnvConfig.supabaseAnonKey),
      hasSupabaseServiceRoleKey: Boolean(privateEnvConfig.supabaseServiceRoleKey),
      hasBrapiToken: Boolean(privateEnvConfig.brapiToken),
    },
  };
}
