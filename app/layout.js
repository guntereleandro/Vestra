import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { brandConfig } from "@/lib/config/brandConfig";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata = {
  title: {
    default: `${brandConfig.appName} — ${brandConfig.tagline}`,
    template: brandConfig.metadataTitleTemplate,
  },
  description: brandConfig.description,
  applicationName: brandConfig.appName,
  metadataBase: brandConfig.websiteUrl ? new URL(brandConfig.websiteUrl) : undefined,
  icons: brandConfig.faviconPaths.icon ? {
    icon: brandConfig.faviconPaths.icon,
    shortcut: brandConfig.faviconPaths.shortcut || undefined,
    apple: brandConfig.faviconPaths.apple || undefined,
  } : undefined,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang={brandConfig.defaultLocale}>
      <body className={`${manrope.variable} ${playfair.variable}`}><AppShell>{children}</AppShell></body>
    </html>
  );
}
