# Central de Conhecimento

`knowledge/` contém a documentação oficial para usuários, desenvolvedores e consumo futuro por IA. `metadata.json` é o manifesto versionado; cada entrada possui `id`, `slug`, `category`, `tags`, `updatedAt` e `version`.

As categorias são tutoriais, conceitos, FAQ, release notes, changelog e glossário. O catálogo estruturado em `lib/knowledge/catalog.js` permanece como fonte local, acessível exclusivamente por `localKnowledgeRepository.js`.

`knowledgeService.js` é a API pública da Central. Ele seleciona o provider configurado, filtra apenas artigos `published/public`, resolve URLs, pesquisa e relacionados e mantém fallback local. Componentes React, rotas, Command Palette e ajuda contextual não importam o catálogo.

O schema editorial contém `id`, `slug`, `category`, `title`, `description`, `tags`, `version`, `updatedAt`, `content`, `relatedIds`, `status`, `visibility`, `author` e `revision`.

Cada artigo possui URL própria em `/conhecimento/[category]/[slug]`, conteúdo textual independente do HTML, metadados normalizados, artigos relacionados e retorno para sua categoria. Categorias e slugs inválidos usam o tratamento padrão de conteúdo não encontrado.

A pesquisa da Central e a Command Palette consultam título, categoria, tags, descrição e conteúdo estruturado pelo repositório. A validação automática verifica contrato, publicação, visibilidade, relacionados, IDs, slugs, metadados, rotas e fallback com `npm run test:knowledge`.

## Governança obrigatória

Toda funcionalidade criada ou alterada deve atualizar tutorial, FAQ, Release Notes, Glossário quando necessário e `knowledge/metadata.json`. Uma funcionalidade não está concluída enquanto sua documentação oficial estiver desatualizada.

## Consumo futuro por IA

O conteúdo deve continuar factual, autocontido, segmentado, versionado e livre de dados pessoais.
