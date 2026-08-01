import { brandConfig } from "@/lib/config/brandConfig";

export default function sitemap() {
  const base = brandConfig.websiteUrl || "http://localhost:3000";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/mercado`, changeFrequency: "daily", priority: 0.8 },
  ];
}
