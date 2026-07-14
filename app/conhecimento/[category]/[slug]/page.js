import { notFound } from "next/navigation";
import KnowledgeArticlePage from "@/components/knowledge/KnowledgeArticlePage";
import { getArticleByRoute, getArticleRouteParams, getRelatedArticles } from "@/lib/knowledge/knowledgeService";

export function generateStaticParams() { return getArticleRouteParams(); }
export async function generateMetadata({ params }) { const { category, slug } = await params, article = getArticleByRoute(category, slug); return article ? { title: article.title, description: article.description } : { title: "Artigo não encontrado" }; }
export default async function Page({ params }) { const { category, slug } = await params, article = getArticleByRoute(category, slug); if (!article) notFound(); return <KnowledgeArticlePage article={article} related={getRelatedArticles(article.id)} />; }
