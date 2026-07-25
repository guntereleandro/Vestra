import PlaceholderPage from "@/components/layout/PlaceholderPage";
import { brandConfig } from "@/lib/config/brandConfig";
export const metadata = { title: "IA" };
export default function Page() { return <PlaceholderPage eyebrow={`Inteligência ${brandConfig.appName}`} title="IA" description="Obtenha leituras e insights sobre sua carteira com apoio de inteligência artificial." />; }
