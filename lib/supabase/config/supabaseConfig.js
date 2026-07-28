import "server-only";

import { privateEnvConfig } from "../../config/envConfig.js";
import { publicEnvConfig } from "../../config/publicEnvConfig.js";

export const SUPABASE_CONFIG_ERROR_CODE = "SUPABASE_CONFIG_MISSING";

function normalizeConfig(config = {}) {
  return Object.freeze({
    url: config.url || "",
    publishableKey: config.publishableKey || config.anonKey || "",
    secretKey: config.secretKey || config.serviceRoleKey || "",
  });
}

export function getSupabaseConfig(overrides) {
  return normalizeConfig(overrides || {
    url: publicEnvConfig.supabaseUrl,
    publishableKey: publicEnvConfig.supabasePublishableKey,
    secretKey: privateEnvConfig.supabaseSecretKey,
  });
}

export function getSupabaseConfigDiagnostics(overrides) {
  const config = getSupabaseConfig(overrides);
  return Object.freeze({
    hasUrl: Boolean(config.url),
    hasPublishableKey: Boolean(config.publishableKey),
    hasSecretKey: Boolean(config.secretKey),
    serverReady: Boolean(config.url && config.publishableKey),
    adminReady: Boolean(config.url && config.secretKey),
  });
}

export function requireSupabaseConfig(options = {}) {
  const config = getSupabaseConfig(options.config);
  const missing = [];

  if (!config.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (options.admin ? !config.secretKey : !config.publishableKey) {
    missing.push(options.admin ? "SUPABASE_SECRET_KEY" : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (missing.length) {
    const error = new Error(`Configuração Supabase ausente: ${missing.join(", ")}.`);
    error.name = "SupabaseConfigError";
    error.code = SUPABASE_CONFIG_ERROR_CODE;
    error.missing = Object.freeze([...missing]);
    throw error;
  }

  return config;
}
