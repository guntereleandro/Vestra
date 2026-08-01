# Roadmap do Vestra Core

Cada etapa deve ser pequena, documentada, compatível, aprovada separadamente e terminar com lint e build aprovados. A ordem solicitada foi preservada.

## CORE-00 — Auditoria e documentação

Entrega: mapa fiel, inventário local, dívidas, banco conceitual, marca e roadmap.

Aceite: somente documentação alterada; nenhum dado, dependência, versão, interface ou comportamento alterado.

## CORE-01 — Configuração central de marca e ambiente

Dependência: CORE-00.

Entrega: contrato único para identidade pública e variáveis por ambiente; consumidores migrados em lotes pequenos, mantendo “Vestra” e a aparência atuais.

Aceite: busca residual classificada; metadados e shell usam configuração; variáveis obrigatórias têm validação; nenhuma chave local é renomeada.

Status: concluída em 2026-07-25. Identidade, metadados e ambiente foram centralizados; segredos permanecem server-only; nenhuma chave ou comportamento foi alterado.

## CORE-02 — Preparação da camada de persistência

Dependência: CORE-01.

Entrega: interfaces de repositório por domínio e adapter local compatível. Separar leitura/escrita de efeitos de UI e unificar backup.

Aceite: mesmos dados e cálculos antes/depois; inventário coberto por testes; backup declara claramente inclusões; sem Supabase.

Status: concluída em 2026-07-25. Sete contratos assíncronos, adapters locais, registry, serviços e validação isolada foram introduzidos sem novas chaves ou alteração do backup.

## CORE-03 — Infraestrutura Supabase

Dependência: CORE-02.

Entrega: SDKs oficiais, clientes Browser/Server/Admin, configuração server-only, helpers, Proxy não bloqueante, adapters stub e registry preparado para múltiplos providers.

Aceite: zero segredo no cliente; variáveis ausentes não quebram build; stubs retornam `NOT_IMPLEMENTED`; Provider Local permanece ativo; sem tabela, autenticação ou migração.

Status: concluída em 2026-07-27. A infraestrutura foi preparada sem conexão remota, SQL, tabelas, RLS, login, sincronização ou alteração de dados.

Justificativa do ajuste: a especificação aprovada da CORE-03 restringiu a etapa à infraestrutura. Para preservar entregas pequenas e permitir políticas RLS testáveis junto ao domínio real, o schema foi distribuído entre CORE-04 (perfil), CORE-05 (carteiras e membros) e CORE-06 (ativos e operações).

## CORE-04 — Autenticação e perfis

Dependência: CORE-03.

Entrega: conexão do ambiente Supabase, login, logout, confirmação, recuperação, sessão SSR, callback PKCE e proteção incremental de `/conta`. Sem tabela de negócio; operações e carteira permanecem locais.

Aceite: `/conta` protegida por identidade verificada; demais rotas compatíveis; sessão expirada tratada; nenhum dado local associado ao Auth User.

Status: implementada em 2026-07-27. Validação ponta a ponta depende das credenciais e configuração de um projeto Supabase Development.

## CORE-05 — Carteiras e permissões

Dependência: CORE-04.

Entrega: schema de Profile, carteiras e membros com RLS; adaptação de ProfilesRepository; carteira padrão, seleção e papéis owner/editor/viewer.

Aceite: isolamento comprovado entre usuários; viewer não escreve; troca de carteira não mistura estado.

Status: concluída em 2026-07-30. Três migrations estão aplicadas no Development; 50 testes pgTAP, validação do dump remoto, matriz SDK de RLS, backfill e fluxo real de `/conta` foram aprovados. Provider Local e todos os dados financeiros permaneceram inalterados.

## CORE-06 — Domínio persistente (parte 1)

Dependência: CORE-05.

Entrega: assets master, asset quotes, carteira ativa e preferências por carteira, com adapters Supabase, RLS e sincronização Local → Supabase não destrutiva.

Aceite: Provider Local preservado; nenhuma chave renomeada; engine intacta; RLS e isolamento aprovados local e remotamente.

Status: concluída em 2026-07-31. A ordem foi dividida para manter a entrega pequena: operações foram movidas para a CORE-07.

## CORE-07 — Operações persistentes

Dependência: CORE-06.

Entrega: tabela e adapter de operações, migração idempotente, reconciliação com dados locais e preservação integral da engine.

Aceite: CRUD remoto consistente; zero dupla contagem; preço médio, saldo e proventos reconciliados; rollback e retomada seguros.

Status: concluída em 2026-07-31. Importação manual com backup, reconciliação conservadora, UUIDs estáveis, RLS, regressão comum aos providers e benchmarks aprovados.

## CORE-08 — Leitura remota e selecao da fonte

Dependência: CORE-07.

Entrega: resolver de fonte unica, escolha Local/Supabase, CRUD remoto por papel, troca segura de carteira e comparacao financeira.

Aceite: Local default; escolha remota explicita; nenhum modo hibrido ou dual write; cache isolado por carteira; engine inalterada.

Status: concluida e validada remotamente em 2026-08-01. A ativacao operacional remota foi antecipada porque proventos dependem do consumo das operacoes persistidas. Migration, matriz SDK, RLS, CRUD e jornada visual foram aprovados; nenhuma tabela financeira nova foi criada.

## CORE-09 — Landing, area privada e onboarding

Dependência: CORE-08.

Entrega: Landing publica, Mercado publico, area patrimonial protegida, retorno exato apos login, onboarding minimo, SEO e layouts separados.

Aceite: visitante nao acessa patrimonio; usuario sem carteira conclui primeiro acesso; usuario existente entra no Dashboard; logout retorna a Landing.

Status: concluida em 2026-08-01. Esta etapa foi priorizada antes de proventos para estabelecer a fronteira de seguranca e a jornada de entrada do produto; nenhuma regra financeira ou tabela foi alterada.

## CORE-10 — Proventos operacionais

Dependência: CORE-09.

Entrega: fluxo de proventos derivado das operacoes da fonte selecionada, com filtros, totais e CRUD consistente.

Aceite: nenhuma dupla contagem; Local e Supabase produzem os mesmos resultados; viewer permanece somente leitura.

## CORE-11 — Estabilização e testes de uso diário

Dependência: CORE-10.

Entrega: testes dos fluxos críticos, acessibilidade e mobile, tratamento de erros, observabilidade mínima, backup/export e checklist operacional.

Aceite: jornadas críticas automatizadas; nenhum bloqueador aberto; restauração e incidentes básicos documentados.

## CORE-12 — Validação dos 30 dias

Dependência: CORE-11.

Entrega: protocolo de uso, diário de lacunas, métricas e decisão de conclusão.

Aceite: 30 dias consecutivos sem recorrer ao Investidor10 para funções essenciais; qualquer exceção deve ser classificada e resolvida ou formalmente retirada do escopo.

## Dependências críticas

```text
Configuração
  -> contratos de persistência
    -> schema/RLS
      -> identidade
        -> carteira/permissões
          -> operações
            -> consolidação
              -> proventos
                -> snapshots/dashboard
                  -> migração real
                    -> estabilização
                      -> 30 dias
```

## Ajustes de ordem

Só são permitidos mediante decisão registrada em `docs/DECISIONS.md`, contendo motivo, risco, impacto em dados, plano de reversão e novo critério de aceite. Trabalho preparatório pode ocorrer dentro de uma etapa, mas não deve ativar antecipadamente um domínio posterior.
