import KnowledgeCategory from "@/components/knowledge/KnowledgeCategory";
import { getArticlesByCategory } from "@/lib/knowledge/knowledgeService";
import { brandConfig } from "@/lib/config/brandConfig";
export const metadata = { title: "Tutoriais" };
export default function Page() { return <KnowledgeCategory category="tutorials" articles={getArticlesByCategory("tutorials")} description={`Guias das principais áreas e fluxos do ${brandConfig.appName}.`} />; }
