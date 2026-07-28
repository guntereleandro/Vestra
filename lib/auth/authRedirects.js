import { AUTH_ERROR_CODES, authError } from "./authErrors.js";
import { publicEnvConfig } from "../config/publicEnvConfig.js";

export const DEFAULT_AUTH_REDIRECT = "/conta";

export function getSafeRedirectPath(value, fallback = DEFAULT_AUTH_REDIRECT) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://local.invalid");
    if (parsed.origin !== "https://local.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function requireSafeRedirectPath(value, fallback = DEFAULT_AUTH_REDIRECT) {
  const safe = getSafeRedirectPath(value, fallback);
  if (value && safe === fallback && value !== fallback) {
    throw authError(AUTH_ERROR_CODES.UNSAFE_REDIRECT);
  }
  return safe;
}

export function getAuthBaseUrl(runtimeOrigin = "") {
  return publicEnvConfig.appUrl
    || publicEnvConfig.siteUrl
    || String(runtimeOrigin || "").replace(/\/$/, "");
}

export function getAuthCallbackUrl({ next = DEFAULT_AUTH_REDIRECT, type = "", runtimeOrigin = "" } = {}) {
  const baseUrl = getAuthBaseUrl(runtimeOrigin);
  if (!baseUrl) throw authError(AUTH_ERROR_CODES.AUTH_NOT_CONFIGURED);
  const callback = new URL("/auth/callback", baseUrl);
  callback.searchParams.set("next", getSafeRedirectPath(next));
  if (type) callback.searchParams.set("type", type);
  return callback.toString();
}

