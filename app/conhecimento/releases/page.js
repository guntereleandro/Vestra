import KnowledgeCategory from "@/components/knowledge/KnowledgeCategory";
import { getArticlesByCategory } from "@/lib/knowledge/knowledgeService";
export const metadata = { title: "Release Notes" };
export default function Page() { return <KnowledgeCategory category="release-notes" articles={getArticlesByCategory("release-notes")} description="Marcos públicos das versões 0.1 a 0.8.2." />; }
