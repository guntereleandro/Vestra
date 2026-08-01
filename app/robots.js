import { brandConfig } from "@/lib/config/brandConfig";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/mercado", "/mercado/"], disallow: ["/dashboard", "/carteira", "/operacoes", "/proventos", "/objetivos", "/metas", "/conta", "/configuracoes", "/conhecimento", "/relatorios", "/simulacoes", "/imposto-de-renda", "/ia", "/onboarding", "/entrar", "/cadastrar", "/recuperar-senha", "/atualizar-senha"] }],
    sitemap: brandConfig.websiteUrl ? `${brandConfig.websiteUrl}/sitemap.xml` : undefined,
  };
}
