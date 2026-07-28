"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnvConfig } from "../../config/publicEnvConfig.js";

export const SUPABASE_BROWSER_CONFIG_ERROR_CODE = "SUPABASE_BROWSER_CONFIG_MISSING";

function requireBrowserConfig(config = {}) {
  const url = typeof config.url === "string" ? config.url.trim() : "";
  const publishableKeyValue = config.publishableKey || config.anonKey;
  const publishableKey = typeof publishableKeyValue === "string" ? publishableKeyValue.trim() : "";

  if (!url || !publishableKey) {
    const error = new Error("A configuração pública do Supabase ainda não está disponível.");
    error.name = "SupabaseBrowserConfigError";
    error.code = SUPABASE_BROWSER_CONFIG_ERROR_CODE;
    throw error;
  }

  return { url, publishableKey };
}

export function createBrowserSupabaseClient(config) {
  const { url, publishableKey } = requireBrowserConfig(config || {
    url: publicEnvConfig.supabaseUrl,
    publishableKey: publicEnvConfig.supabasePublishableKey,
  });
  return createBrowserClient(url, publishableKey);
}

export function isBrowserSupabaseConfigured() {
  return Boolean(publicEnvConfig.supabaseUrl && publicEnvConfig.supabasePublishableKey);
}
