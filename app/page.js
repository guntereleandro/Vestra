import LandingPage from "@/components/landing/LandingPage";
import { brandConfig } from "@/lib/config/brandConfig";

export const metadata = {
  title: `${brandConfig.appName} — ${brandConfig.tagline}`,
  description: brandConfig.description,
  alternates: { canonical: "/" },
  openGraph: { title: `${brandConfig.appName} — ${brandConfig.tagline}`, description: brandConfig.description, type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: `${brandConfig.appName} — ${brandConfig.tagline}`, description: brandConfig.description },
};

export default function HomePage() {
  return <LandingPage />;
}
