import KnowledgeCategory from "@/components/knowledge/KnowledgeCategory";
import { getArticlesByCategory } from "@/lib/knowledge/knowledgeService";
export const metadata = { title: "Conceitos" };
export default function Page() { return <KnowledgeCategory category="concepts" articles={getArticlesByCategory("concepts")} description="Indicadores e conceitos financeiros apresentados com contexto e limitações." />; }
