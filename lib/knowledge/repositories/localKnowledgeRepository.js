import metadata from "../../../knowledge/metadata.json" with { type: "json" };
import { knowledgeArticles } from "../catalog.js";
import { validateRepositoryContract } from "./knowledgeRepository.js";

const categoryRoutes = Object.freeze({ tutorials: "tutorials", concepts: "concepts", faq: "faq", "release-notes": "releases", glossary: "glossary", changelog: "changelog" });

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function routeToCategory(route) {
  return Object.entries(categoryRoutes).find(([, value]) => value === route)?.[0] || null;
}

function searchLocalArticles(query) {
  const term = normalizeText(query).trim();
  if (!term) return [];
  return knowledgeArticles.filter((item) => normalizeText([item.title, item.description, item.category, ...item.tags, ...item.content].join(" ")).includes(term));
}

function relatedLocalArticles(articleId) {
  const source = knowledgeArticles.find((item) => item.id === articleId);
  if (!source) return [];
  const explicit = source.relatedIds.map((id) => knowledgeArticles.find((item) => item.id === id)).filter(Boolean);
  const explicitIds = new Set(explicit.map((item) => item.id));
  const tags = new Set(source.tags.map(normalizeText));
  const inferred = knowledgeArticles
    .filter((item) => item.id !== source.id && !explicitIds.has(item.id))
    .map((item) => ({ item, relevance: (item.category === source.category ? 2 : 0) + item.tags.filter((tag) => tags.has(normalizeText(tag))).length }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.item.title.localeCompare(b.item.title, "pt-BR"))
    .map(({ item }) => item);
  return [...explicit, ...inferred].slice(0, 3);
}

export const localKnowledgeRepository = {
  getAllArticles: () => [...knowledgeArticles],
  getArticleByRoute(category, slug) {
    const normalizedCategory = routeToCategory(category);
    return normalizedCategory ? knowledgeArticles.find((item) => item.category === normalizedCategory && item.slug === slug) || null : null;
  },
  getArticleById: (id) => knowledgeArticles.find((item) => item.id === id) || null,
  getArticlesByCategory: (category) => knowledgeArticles.filter((item) => item.category === category),
  searchArticles: searchLocalArticles,
  getRelatedArticles: relatedLocalArticles,
  getKnowledgeMetadata: () => ({ ...metadata, articles: metadata.articles.map((item) => ({ ...item })) }),
  validateKnowledge() {
    const contract = validateRepositoryContract(localKnowledgeRepository);
    const errors = contract.missingMethods.map((method) => `Método ausente: ${method}`);
    const ids = new Set();
    const routes = new Set();
    const statuses = new Set(["draft", "published", "archived"]);
    const visibilities = new Set(["public", "private", "internal"]);
    for (const item of knowledgeArticles) {
      if (ids.has(item.id)) errors.push(`ID duplicado: ${item.id}`);
      if (routes.has(`${item.category}/${item.slug}`)) errors.push(`Rota duplicada: ${item.category}/${item.slug}`);
      if (!statuses.has(item.status)) errors.push(`Status inválido: ${item.id}`);
      if (!visibilities.has(item.visibility)) errors.push(`Visibilidade inválida: ${item.id}`);
      ids.add(item.id);
      routes.add(`${item.category}/${item.slug}`);
    }
    for (const item of knowledgeArticles) item.relatedIds.forEach((id) => { if (!ids.has(id) || id === item.id) errors.push(`relatedId inválido em ${item.id}: ${id}`); });
    return { valid: errors.length === 0, errors, provider: "local" };
  },
};

export const localKnowledgeRoutes = categoryRoutes;
