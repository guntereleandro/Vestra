# Engenharia do Vestra

## Regras

- A engine financeira nunca depende da interface.
- A interface nunca contém regras financeiras.
- Todo cálculo deve ser determinístico.
- Toda funcionalidade precisa ser testável.
- Toda persistência deve passar pela camada de dados.
- Componentes React apenas apresentam dados.
- Hooks coordenam comportamento.
- Engine realiza cálculos.

## Diagnosticos patrimoniais

- Diagnosticos devem ser funcoes puras, deterministicas e validadas por fixtures.
- Regras e limites ficam centralizados em `lib/engine/diagnostics/diagnosticRules.js`.
- Mensagens devem ser factuais e neutras, nunca recomendacoes financeiras.
- Alteracoes devem executar o validador de diagnosticos, lint e build.

## Documentacao de produto

- Funcionalidades novas ou alteradas devem atualizar tutorial, FAQ, Release Notes, Glossario quando necessario e `knowledge/metadata.json`.
- A Central de Conhecimento faz parte do criterio de conclusao.
- Consumidores da Central devem usar `lib/knowledge/knowledgeService.js`; somente o repositório local pode importar o catálogo diretamente.
- Apenas artigos `published` e `public` podem ser expostos pela aplicação.
