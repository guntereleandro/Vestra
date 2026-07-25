import { publicEnvConfig } from "./publicEnvConfig.js";

const appName = "Vestra";
const appUrl = publicEnvConfig.appUrl;
const websiteUrl = publicEnvConfig.siteUrl || appUrl;

export const brandConfig = Object.freeze({
  internalProjectName: "Vestra",
  appName,
  shortName: appName,
  tagline: "Sua carteira, sob controle",
  description: "Gerenciador pessoal de carteira de investimentos.",
  legalName: "",
  supportEmail: "",
  contactEmail: "",
  websiteUrl,
  appUrl,
  publicMarketUrl: appUrl ? `${appUrl}/mercado` : "/mercado",
  documentationUrl: appUrl ? `${appUrl}/conhecimento` : "/conhecimento",
  socialLinks: Object.freeze({
    instagram: "",
    linkedin: "",
    x: "",
    youtube: "",
  }),
  logoPaths: Object.freeze({
    primary: "",
    compact: "",
    mark: "",
    social: "",
  }),
  faviconPaths: Object.freeze({
    icon: "",
    shortcut: "",
    apple: "",
  }),
  defaultLocale: "pt-BR",
  defaultCurrency: "BRL",
  metadataTitleTemplate: `%s | ${appName}`,
  backupFilePrefix: "vestra-backup",
});

export function formatBrandText(text) {
  return String(text || "").replaceAll("{appName}", brandConfig.appName);
}
