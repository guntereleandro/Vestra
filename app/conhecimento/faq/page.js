import KnowledgeCategory from "@/components/knowledge/KnowledgeCategory";
import { getArticlesByCategory } from "@/lib/knowledge/knowledgeService";
export const metadata = { title: "Perguntas frequentes" };
export default function Page() { return <KnowledgeCategory category="faq" title="Perguntas frequentes" articles={getArticlesByCategory("faq")} description="Respostas rápidas sobre todas as áreas atuais." />; }
