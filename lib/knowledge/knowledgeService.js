import { appConfig } from "../config/appConfig.js";
import { localKnowledgeRepository, localKnowledgeRoutes } from "./repositories/localKnowledgeRepository.js";

const categoryLabels = Object.freeze({ tutorials: "Tutoriais", concepts: "Conceitos", faq: "FAQ", "release-notes": "Release Notes", glossary: "Glossário", changelog: "Changelog" });
const visible = (article) => article?.status === "published" && article?.visibility === "public";

function normalizeArticle(article) {
  if (!article) return null;
  return {
    id: String(article.id || ""), slug: String(article.slug || ""), category: String(article.category || ""),
    title: String(article.title || ""), description: String(article.description || ""),
    tags: Array.isArray(article.tags) ? [...article.tags] : [], version: String(article.version || ""),
    updatedAt: String(article.updatedAt || ""), content: Array.isArray(article.content) ? [...article.content] : [],
    relatedIds: Array.isArray(article.relatedIds) ? [...article.relatedIds] : [], status: String(article.status || "draft"),
    visibility: String(article.visibility || "private"), author: String(article.author || ""), revision: Number(article.revision) || 0,
  };
}

export function resolveKnowledgeRepository(provider = appConfig.knowledgeProvider) {
  if (provider === "local") return localKnowledgeRepository;
  return localKnowledgeRepository;
}

export function getAllArticles() { return resolveKnowledgeRepository().getAllArticles().map(normalizeArticle).filter(visible); }
export function getArticleByRoute(category, slug) { const article = normalizeArticle(resolveKnowledgeRepository().getArticleByRoute(category, slug)); return visible(article) ? article : null; }
export function getArticleById(id) { const article = normalizeArticle(resolveKnowledgeRepository().getArticleById(id)); return visible(article) ? article : null; }
export function getArticlesByCategory(category) { return resolveKnowledgeRepository().getArticlesByCategory(category).map(normalizeArticle).filter(visible); }
export function searchArticles(query) { return resolveKnowledgeRepository().searchArticles(query).map(normalizeArticle).filter(visible); }
export function getRelatedArticles(articleId) { return resolveKnowledgeRepository().getRelatedArticles(articleId).map(normalizeArticle).filter(visible); }
export function getKnowledgeMetadata() { return resolveKnowledgeRepository().getKnowledgeMetadata(); }
export function validateKnowledge() { return resolveKnowledgeRepository().validateKnowledge(); }
export function getKnowledgeCategories() { return Object.entries(categoryLabels).map(([id, label]) => ({ id, label, route: localKnowledgeRoutes[id] })); }
export function getCategoryLabel(category) { return categoryLabels[category] || category; }
export function getArticleHref(article) { return `/conhecimento/${localKnowledgeRoutes[article.category]}/${article.slug}`; }
export function getCategoryHref(category) { return ["tutorials", "concepts", "faq", "release-notes"].includes(category) ? `/conhecimento/${localKnowledgeRoutes[category]}` : "/conhecimento"; }
export function getArticleRouteParams() { return getAllArticles().map((article) => ({ category: localKnowledgeRoutes[article.category], slug: article.slug })); }

const helpArticleIds = Object.freeze({ "/": "tutorial-dashboard", "/carteira": "tutorial-carteira", "/operacoes": "tutorial-operacoes", "/proventos": "tutorial-operacoes", "/objetivos": "tutorial-objetivos", "/metas": "tutorial-objetivos", "/mercado": "tutorial-mercado", "/configuracoes": "tutorial-estrategia", "/relatorios": "tutorial-performance", "/imposto-de-renda": "faq-areas", "/simulacoes": "concept-rentabilidade", "/ia": "faq-areas" });
export function getContextualHelpHref(pathname) {
  const articleId = Object.entries(helpArticleIds).sort((a, b) => b[0].length - a[0].length).find(([route]) => route === "/" ? pathname === "/" : pathname.startsWith(route))?.[1];
  const article = articleId ? getArticleById(articleId) : null;
  return article ? getArticleHref(article) : null;
}
