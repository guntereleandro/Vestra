import { appConfig } from "../lib/config/appConfig.js";
import {
  getAllArticles,
  getArticleById,
  getArticleByRoute,
  getArticleHref,
  getArticleRouteParams,
  getArticlesByCategory,
  getKnowledgeMetadata,
  getRelatedArticles,
  resolveKnowledgeRepository,
  searchArticles,
  validateKnowledge,
} from "../lib/knowledge/knowledgeService.js";
import { knowledgeRepositoryMethods, validateRepositoryContract } from "../lib/knowledge/repositories/knowledgeRepository.js";
import { localKnowledgeRepository } from "../lib/knowledge/repositories/localKnowledgeRepository.js";

const errors = [];
const required = ["id", "slug", "category", "title", "description", "tags", "version", "updatedAt", "content", "relatedIds", "status", "visibility", "author", "revision"];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const articles = getAllArticles();
const metadata = getKnowledgeMetadata();
const ids = new Set();
const slugs = new Set();
const routes = new Set();

const contract = validateRepositoryContract(localKnowledgeRepository);
assert(contract.valid, `Contrato incompleto: ${contract.missingMethods.join(", ")}`);
assert(knowledgeRepositoryMethods.length === 8, "Contrato deve expor oito métodos mínimos");
assert(validateKnowledge().valid, "Validação interna do repositório falhou");
assert(resolveKnowledgeRepository("remote-not-configured") === localKnowledgeRepository, "Fallback local não foi preservado");
assert(appConfig.knowledgeProvider === "local" && !appConfig.enableRemoteKnowledge && !appConfig.enableKnowledgeAdmin, "Configuração de conhecimento inválida");

for (const article of articles) {
  required.forEach((field) => assert(article[field] !== undefined && article[field] !== "", `${article.id || "artigo"}: campo ${field} ausente`));
  assert(article.status === "published", `${article.id}: artigo não publicado exposto`);
  assert(article.visibility === "public", `${article.id}: artigo não público exposto`);
  assert(Array.isArray(article.tags), `${article.id}: tags inválidas`);
  assert(Array.isArray(article.content) && article.content.every((item) => typeof item === "string"), `${article.id}: conteúdo inválido`);
  assert(Array.isArray(article.relatedIds), `${article.id}: relatedIds inválido`);
  assert(Number.isInteger(article.revision) && article.revision > 0, `${article.id}: revisão inválida`);
  assert(!ids.has(article.id), `ID duplicado: ${article.id}`);
  assert(!slugs.has(article.slug), `Slug duplicado: ${article.slug}`);
  ids.add(article.id);
  slugs.add(article.slug);

  const href = getArticleHref(article);
  assert(href.startsWith("/conhecimento/"), `${article.id}: rota inválida`);
  assert(!routes.has(href), `Rota duplicada: ${href}`);
  routes.add(href);
  const params = getArticleRouteParams().find((item) => item.slug === article.slug);
  assert(Boolean(params) && getArticleByRoute(params.category, params.slug)?.id === article.id, `${article.id}: rota não resolve pelo serviço`);
  assert(getArticleById(article.id)?.id === article.id, `${article.id}: busca por ID falhou`);
  assert(getArticlesByCategory(article.category).some((item) => item.id === article.id), `${article.id}: filtro por categoria falhou`);
  assert(searchArticles(article.title).some((item) => item.id === article.id), `${article.id}: pesquisa por título falhou`);
}

for (const article of articles) {
  article.relatedIds.forEach((id) => assert(ids.has(id) && id !== article.id, `${article.id}: relatedId inválido: ${id}`));
  getRelatedArticles(article.id).forEach((related) => assert(ids.has(related.id) && related.id !== article.id, `${article.id}: relacionado inválido`));
}

const metadataIds = new Set(metadata.articles.map((item) => item.id));
assert(metadata.appVersion === "0.8.2", "metadata.json não registra a versão 0.8.2");
assert(metadata.articles.length === articles.length, "Manifesto e repositório possuem quantidades diferentes");
articles.forEach((article) => assert(metadataIds.has(article.id), `${article.id}: ausente no manifesto`));

if (errors.length) {
  console.error(`Validação da Central falhou com ${errors.length} erro(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Knowledge Repository validado: ${articles.length} artigos published/public, ${routes.size} rotas únicas, contrato completo e fallback local ativo.`);
