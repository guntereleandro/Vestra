# Auditoria de Segurança de Dependências

Data: 2026-07-27.

Comando: `npm audit --omit=dev --json`. Nenhum `npm audit fix --force` foi executado.

## Resultado

O primeiro relatório continha três grupos de vulnerabilidades altas. `npm audit fix`, sem `--force`, atualizou `next` de 16.2.10 para 16.2.12 e o PostCSS da cadeia Tailwind de 8.5.16 para 8.5.23. Os advisories próprios do Next foram corrigidos, mas duas dependências empacotadas por ele continuam sinalizadas.

| Pacote | Versão instalada | Alcance | Correção indicada pelo npm | Risco de atualização | Recomendação |
|---|---:|---|---|---|---|
| `next` | 16.2.12 | dependência direta; App Router, Proxy e servidor | corrigido em 16.2.11+ para GHSA-6gpp-xcg3-4w24, GHSA-m99w-x7hq-7vfj, GHSA-89xv-2m56-2m9x e GHSA-p9j2-gv94-2wf4 | médio: framework central | atualização compatível aplicada; lint, build e rotas devem permanecer obrigatórios |
| `postcss` | 8.5.23 na cadeia Tailwind; 8.4.31 dentro do Next | processamento de CSS e source maps | GHSA-qx2v-qp2m-jg93 corrigida em 8.5.10; GHSA-6g55-p6wh-862q após 8.5.11; GHSA-r28c-9q8g-f849 após 8.5.17 | médio: versão vulnerável permanece empacotada no Next | bloqueador para Production até o Next fornecer cadeia corrigida ou substituição compatível |
| `sharp` | 0.34.5 transitivo do Next | otimização de imagens no servidor | GHSA-f88m-g3jw-g9cj corrigida em 0.35.0 | médio: binário nativo | bloqueador para Production até atualização compatível da cadeia do Next |

## Alcance no Vestra

- Não há evidência de exploração no repositório.
- Os advisories próprios do Next foram removidos com 16.2.12.
- `postcss` atua principalmente no pipeline de build.
- `sharp` é dependência opcional/transitiva usada pela otimização de imagens do Next.
- O relatório do npm deve ser refeito após qualquer atualização porque advisories e versões corrigidas mudam.

## Decisão

Foi aplicada somente a atualização compatível oferecida por `npm audit fix`, sem `--force`. O relatório residual continua com três vulnerabilidades altas agregadas por causa do PostCSS e Sharp transitivos do Next.

O npm passou a sugerir `npm audit fix --force` com downgrade incompatível para `next@9.3.3`; essa ação foi rejeitada. Os advisories residuais são dívida técnica bloqueadora para Production, mas não impedem validação local da arquitetura de autenticação.

A correção recomendada é uma entrega de segurança pequena antes de qualquer deploy Production, sem `--force`, com:

1. atualização compatível indicada pelo npm;
2. `npm audit`;
3. todos os validadores;
4. teste manual das rotas de autenticação e mercado;
5. lint e build.
