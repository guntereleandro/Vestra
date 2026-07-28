import "server-only";

import { publicEnvConfig } from "./publicEnvConfig.js";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export const privateEnvConfig = Object.freeze({
  supabaseSecretKey: clean(
    process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
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
      hasSupabaseUrl: Boolean(publicEnvConfig.supabaseUrl),
      hasSupabasePublishableKey: Boolean(publicEnvConfig.supabasePublishableKey),
    },
    private: {
      hasSupabaseSecretKey: Boolean(privateEnvConfig.supabaseSecretKey),
      hasBrapiToken: Boolean(privateEnvConfig.brapiToken),
    },
  };
}
