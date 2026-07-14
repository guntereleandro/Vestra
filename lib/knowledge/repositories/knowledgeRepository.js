export const knowledgeRepositoryMethods = Object.freeze([
  "getAllArticles",
  "getArticleByRoute",
  "getArticleById",
  "getArticlesByCategory",
  "searchArticles",
  "getRelatedArticles",
  "getKnowledgeMetadata",
  "validateKnowledge",
]);

export function validateRepositoryContract(repository) {
  const missingMethods = knowledgeRepositoryMethods.filter((method) => typeof repository?.[method] !== "function");
  return { valid: missingMethods.length === 0, missingMethods };
}
