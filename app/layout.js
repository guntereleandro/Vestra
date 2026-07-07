import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata = {
  title: { default: "Vestra — Sua carteira, sob controle", template: "%s | Vestra" },
  description: "Gerenciador pessoal de carteira de investimentos.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${playfair.variable}`}><AppShell>{children}</AppShell></body>
    </html>
  );
}
