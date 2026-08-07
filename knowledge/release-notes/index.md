# Release Notes

## 2026-08-07 — Compatibilidade de importação

O ledger passou a distinguir desdobramentos, bonificações, conversões e movimentações de caixa remunerado sem criar compras, vendas ou rendimentos fictícios. A importação real continua condicionada à prévia e reconciliação completa.

## 2026-08-07 — CORE-12

A navegação foi limitada às áreas funcionais do Core e foi criado o protocolo oficial de estabilidade e validação dos 30 dias.

## 2026-08-07 — CORE-11

A página de Proventos passou a oferecer métricas, filtros, agrupamentos, histórico e CRUD usando as operações da fonte ativa.

## 2026-08-06 — CORE-10

Dashboard, histórico patrimonial e performance passaram a respeitar integralmente a fonte Local ou Supabase. Foram adicionados snapshots remotos por carteira e importação manual não destrutiva.

Histórico consolidado das versões 0.1 a 0.8.2 do Vestra. A versão 0.8.2 introduziu contrato de repositório, schema editorial normalizado e fallback local.

Recuperação funcional: pesquisa de ativos combinada, campos reais dos módulos BRAPI mapeados e fallback básico para módulos não permitidos.

Correção crítica de Mercado: rotas internas passaram a confiar nos certificados do sistema, aceitar timestamps ISO e devolver a cotação básica junto ao ativo.

CORE-04: autenticação por e-mail e senha, confirmação, recuperação, callback PKCE, cookies SSR e rota Conta protegida. O Provider Local e todos os dados financeiros foram preservados.
CORE-05: schema versionado de profiles, carteiras e membros, RLS, criação atômica de owner e integração mínima na Conta. Dados financeiros continuam locais.
# Infraestrutura CORE-06 — 31 de julho de 2026

O catálogo de ativos, as cotações e as preferências da carteira ativa agora possuem persistência remota protegida quando uma conta está conectada. O uso diário continua compatível com os dados locais existentes; operações, proventos, histórico e dashboard não foram migrados nesta etapa.

# Operações persistentes CORE-07 — 31 de julho de 2026

Operações agora podem ser comparadas e importadas manualmente para o Supabase. A etapa gera backup, usa UUID estável, não remove dados, não sobrescreve conflitos e mantém o Provider Local como origem do uso diário.

# Fonte operacional CORE-08 — 1 de agosto de 2026

Local continua sendo o padrao. O usuario pode ativar Supabase explicitamente, usar CRUD conforme o papel, trocar carteira sem reaproveitar cache e comparar resultados financeiros. A engine permanece independente da origem.

A infraestrutura foi aplicada e validada no Development com testes reais de persistencia, papeis, isolamento, CRUD, recarga, retorno Local e logout.

# Site e primeiro acesso CORE-09 — 1 de agosto de 2026

O produto agora possui Landing, Mercado publico, area patrimonial protegida, retorno ao destino apos login e onboarding minimo. Logout retorna ao site publico; engine e dados financeiros nao foram alterados.
