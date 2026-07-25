const PUBLIC_APP_ENV_VALUES = new Set(["development", "preview", "production", "test"]);

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

function appEnvironment(value) {
  const normalized = clean(value).toLowerCase();
  return PUBLIC_APP_ENV_VALUES.has(normalized) ? normalized : "development";
}

export const publicEnvConfig = Object.freeze({
  appUrl: optionalUrl(process.env.NEXT_PUBLIC_APP_URL),
  siteUrl: optionalUrl(process.env.NEXT_PUBLIC_SITE_URL),
  appEnvironment: appEnvironment(process.env.NEXT_PUBLIC_APP_ENV),
});

export function getPublicEnvDiagnostics() {
  return {
    valid: true,
    appEnvironment: publicEnvConfig.appEnvironment,
    hasAppUrl: Boolean(publicEnvConfig.appUrl),
    hasSiteUrl: Boolean(publicEnvConfig.siteUrl),
  };
}

