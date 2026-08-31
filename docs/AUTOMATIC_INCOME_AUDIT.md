# Auditoria de Proventos Automáticos — CORE-14

Data: 2026-08-30  
Escopo: arquitetura e evidência, sem migration, integração, job, expectativa persistida ou operação criada.

## Decisão executiva

O Vestra ainda não pode transformar eventos externos em operações recebidas. A arquitetura atual representa corretamente apenas o último estágio: `DIVIDENDO`, `JCP` e `RENDIMENTO` convencional efetivamente registrados no ledger. Faltam os estágios independentes de evento global, expectativa da carteira e reconciliação.

Princípio obrigatório:

```text
evento de mercado != expectativa da carteira != operação recebida
```

A abordagem segura para o Core é sincronização manual, geração idempotente de expectativas e confirmação manual do recebimento. Automação sem confirmação depende de fonte com ciclo de vida confiável ou conciliação futura com extrato/corretora.

## Método e limites

- leitura de UI, services, repositories Local/Supabase, engine, Dashboard, diagnostics, snapshots, performance, backup e importadores;
- chamadas reais e sanitizadas em 2026-08-30, usando o token configurado apenas em memória;
- ações: PETR4, ITSA4, BBSE3 e TAEE11;
- FIIs: MXRF11, KNCR11, XPML11 e GARE11;
- ETFs: IVVB11 e GOLD11;
- endpoints testados: cotação com `dividends=true`, `/api/v2/stocks/dividends` e `/api/v2/fii/dividends`;
- carteira real usada somente em memória, a partir dos 109 eventos canônicos reconciliados;
- sandbox e exceções de ticker não foram generalizados para Production.

Nenhum token, resposta bruta, carteira completa ou dado privado foi gravado. Os números abaixo descrevem somente eventos públicos e contagens agregadas.

## Domínio atual

| Área | Estado atual |
|---|---|
| Fonte da verdade | `portfolio_operations` ou `vestra:operations:v1` |
| Tipos recebidos | `DIVIDENDO`, `JCP`, `RENDIMENTO` |
| Regra semântica | `lib/domain/operations/passiveIncome.js` |
| Exclusões | `RENDIMENTO` de `Caixa Remunerado` e `Renda Fixa` |
| CRUD | `operationsService`, respeitando fonte, carteira e papel |
| Repositories | `DividendsRepository` é uma visão filtrada de `OperationsRepository` |
| Página | `/proventos` analisa exclusivamente operações da fonte ativa |
| Dashboard | recordes, timeline e conquistas reutilizam a regra central |
| Diagnostics | renda passiva deriva das mesmas operações válidas |
| Snapshots | persistem somente total realizado de proventos |
| Performance | separa fluxos de capital, valorização e proventos realizados |
| Backup/importação | proventos recebidos viajam como operações; UUID é preservado |

Não existe tabela `dividends`. `income_amount` é uma coluna especializada de `portfolio_operations`, não uma entidade paralela. O backup schema 6 inclui as operações. A importação real não contém proventos recebidos; os ajustes de Mercado Pago e LCI permanecem retorno econômico interno e produzem `dividends = 0`.

### Lacunas atuais

- não há evento global, expectativa por carteira ou vínculo evento–operação;
- operação manual não guarda identidade de evento de mercado;
- UUID da operação garante identidade do fato recebido, não equivalência com providers;
- não há ciclo de correção/cancelamento nem histórico de versões externas;
- o contrato operacional possui apenas uma `date`; não representa todas as datas do evento;
- a posição histórica pode ser recalculada pelo ledger, mas ainda não existe serviço de elegibilidade com calendário e precedência de datas.

## Cobertura real da BRAPI

### Resultado por ativo

| Classe | Ativo | Quote `dividends=true` | Endpoint v2 | Resultado útil |
|---|---|---:|---:|---|
| Ação | PETR4 | 200 / 175 eventos | 200 / 175 eventos | sandbox disponível |
| Ação | ITSA4 | 403 | 403 | bloqueado pelo plano |
| Ação | BBSE3 | 403 | 403 | bloqueado pelo plano |
| Ação/Unit | TAEE11 | 403 | 403 | bloqueado pelo plano |
| FII | MXRF11 | 403 | 200 / 13 eventos | exceção de sandbox no endpoint FII |
| FII | KNCR11 | 403 | 403 | bloqueado pelo plano |
| FII | XPML11 | 403 | 403 | bloqueado pelo plano |
| FII | GARE11 | 403 | 403 | bloqueado pelo plano |
| ETF | IVVB11 | 403 | 400 no endpoint de ações | contrato não aplicável/comprovado |
| ETF | GOLD11 | 403 | 400 no endpoint de ações | contrato não aplicável/comprovado |

PETR4 retornou rótulos `JCP`, `DIVIDENDO` e `RENDIMENTO`; MXRF11 retornou `RENDIMENTO`. A resposta observada não apresentou duplicidade exata pela identidade composta usada na auditoria, mas isso não substitui uma chave canônica persistida.

### Cobertura de campos observada

| Campo | PETR4 | MXRF11 | Conclusão |
|---|---:|---:|---|
| valor por ação/cota (`rate`) | 175/175 | 13/13 | disponível nos casos acessíveis |
| data-com (`lastDatePrior`) | 175/175 | 13/13 | disponível; deve ser preservada como data de elegibilidade |
| pagamento (`paymentDate`) | 175/175 | 13/13 | disponível nos casos observados |
| aprovação (`approvedOn`) | 164/175 | 0/13 | opcional e incompleta |
| `exDate` separado | 0/175 | 0/13 | não entregue nesse contrato |
| moeda | 0/175 | 0/13 | deve vir de identidade do instrumento ou outra fonte, nunca ser presumida silenciosamente |
| status | 0/175 | 0/13 | não há `announced/paid/cancelled` explícito |
| provider event ID | 0/175 | 0/13 | identidade precisa ser derivada e manter aliases |
| correção/cancelamento explícito | não observado | não observado | atualização por diff não é suficiente para alterar operação recebida |

O endpoint atual usado pelo `brapiProvider` preserva aprovação, data-com e pagamento, mas limita a lista normalizada a 24 itens e não implementa endpoint v2, paginação, versão, status ou cancelamento. `lastDatePrior` deve ser tratado como último dia com direito; não é um `exDate` separado.

### Ações, FIIs e ETFs

- **Ações:** o contrato documentado diferencia `DIVIDENDO` e `JCP`, além de expor eventos patrimoniais em coleções separadas. Bonificação, split e subscrição nunca devem virar provento recebido.
- **FIIs:** rendimento e amortização têm semânticas distintas. `RENDIMENTO` pode originar expectativa passiva; amortização é devolução de capital e exige contrato próprio antes de afetar o ledger. Datas podem vir de comunicados ou backfill de informes mensais.
- **ETFs:** a amostra não confirmou distribuição utilizável para IVVB11 ou GOLD11. O Vestra não deve criar suporte artificial nem inferir ausência de distribuição como dado universal.

Referências oficiais consultadas: [BRAPI — dividendos de ações](https://brapi.dev/docs/acoes/dividendos), [BRAPI — dividendos de FIIs](https://brapi.dev/docs/fiis/dividendos), [BRAPI — FAQ de dividendos/JCP](https://brapi.dev/faq/como-os-dados-de-dividendos-dos-planos-pagos-me-ajudam) e [OpenAPI BRAPI](https://brapi.dev/docs/openapi).

## Fontes complementares avaliadas

| Fonte | Cobertura/confiabilidade | Licença/custo | Latência/histórico | Complexidade e papel possível |
|---|---|---|---|---|
| CVM Dados Abertos | fonte regulatória; IPE de companhias e informes estruturados de FIIs | ODbL; gratuita, exige observar atribuição/share-alike | IPE e informes atualizados periodicamente; históricos publicados por janelas | ingestão, parsing, reapresentações e vínculo emissor–ticker são trabalhosos; boa evidência/validação, não confirmação de crédito |
| B3 portal público | fonte primária para eventos divulgados | acesso público sujeito aos termos do portal | consulta e arquivos públicos, sem contrato operacional do Vestra | útil para verificação manual; automação precisa diligência técnica e jurídica |
| B3 UP2DATA Eventos Corporativos | estruturado, com lifecycle, atualizações e cancelamentos | comercial; política e redistribuição exigem contrato | intradiário/diário e eventos ativos | melhor candidato institucional, mas custo e licença precisam ser negociados |
| RI de companhias | fonte primária do emissor | normalmente pública; termos variam | rápida para anúncio, histórico fragmentado | fallback humano e evidência de conflito; sem API padronizada |
| administradores/gestores de FIIs | fonte primária de comunicados do fundo | termos variam | próxima do anúncio; arquivos heterogêneos | validação de FII e amortização, com alto custo operacional |
| outros providers | podem normalizar múltiplas fontes | preço, SLA e redistribuição variam | depende do contrato | só avaliar após matriz formal de cobertura, eventos, correções e licença |

Fontes: [CVM — IPE de companhias](https://dados.cvm.gov.br/dataset/cia_aberta-doc-ipe), [CVM — informe mensal de FII](https://dados.cvm.gov.br/dataset/fii-doc-inf_mensal), [B3 — dados disponíveis](https://www.b3.com.br/main.jsp?doui_processActionId=setLocaleProcessAction&locale=pt_BR&lumA=1&lumII=2C9FBE6363B13B3A0163B28EE6C0267F&lumPageId=8A6A922D600EFE0901600F1239093F20) e [B3 — hub público](https://www.b3.com.br/pt_br/dados/hub-de-dados-publicos/).

## Dry-run da carteira real

O ledger reconciliado possui 109 eventos e 22 posições de renda variável. Foram recalculadas posições no fechamento da data-com, sem gravar expectativa:

| Evento público observado | Data-com | Quantidade histórica calculada | Valor teórico bruto | Classificação |
|---|---:|---:|---:|---|
| PETR4 JCP, pagamento 2026-12-21 | 2026-08-21 | 6 | `6 × 0,202504 = R$ 1,215024` | candidato anunciado; não recebido |
| PETR4 dividendo, pagamento 2026-12-21 | 2026-08-21 | 6 | `6 × 0,471567 = R$ 2,829402` | candidato anunciado; não recebido |
| MXRF11 rendimento, pagamento 2026-08-14 | 2026-07-31 | 30 | `30 × 0,10 = R$ 3,00` | candidato histórico; recebimento não comprovado |
| MXRF11 rendimento, pagamento 2026-07-14 | 2026-06-30 | 30 | `30 × 0,10 = R$ 3,00` | candidato histórico; recebimento não comprovado |

Esses valores demonstram o cálculo de elegibilidade, não comprovam custódia final, retenções, crédito ou completude da fonte. ITSA4, BBSE3, TAEE11, KNCR11, XPML11 e GARE11 não puderam ser auditados no plano atual; ETFs não tiveram evento utilizável. Nenhum registro foi criado.

## Riscos e bloqueadores

### A — bloqueia automação segura

1. cobertura da fonte atual insuficiente para a carteira real;
2. ausência de status, ID estável, correção e cancelamento confiáveis;
3. inexistência de entidades separadas para evento, expectativa e reconciliação;
4. ausência de algoritmo testado de elegibilidade histórica e calendário B3;
5. ausência de matching conservador com operação manual;
6. ausência de consentimento transacional para converter expectativa em operação.

### B — importante

- moeda não explícita e aprovação incompleta;
- FII precisa distinguir rendimento de amortização;
- múltiplas fontes exigem precedência, conflito e versionamento;
- posição por carteira/corretora futura e eventos em datas limítrofes;
- operação existente não possui `grossAmount`, retenções ou vínculo externo estruturado.

### C — UX

- abas Recebidos/A receber, confiança e origem;
- revisão de conflitos, ignorar, vincular e confirmar;
- mensagens para datas/valores ainda desconhecidos.

### D — limitação externa

- `403` do plano BRAPI na maior parte da amostra;
- sandbox não representa Production;
- fragmentação de RI/administradores;
- custo, licença e redistribuição de dados B3/provider.

### E — pós-Core

- crédito totalmente automático;
- conciliação com corretoras/extratos;
- motor tributário completo de JCP;
- múltiplas corretoras e custódia emprestada;
- cron distribuído, filas e observabilidade avançada.

## Gate para implementação

A primeira implementação pode avançar somente para **eventos + expectativas sem crédito automático**, desde que:

1. schema conceitual de `INCOME_EVENT_MODEL.md` seja convertido em migration/RLS testáveis;
2. provider escolhido cubra a carteira-alvo ou declare lacunas por ativo;
3. sincronização seja manual, idempotente e sem operação automática;
4. elegibilidade histórica seja testada com trades, split, bônus e conversão;
5. confirmação gere uma operação em transação, preservando UUID manual quando reconciliada;
6. snapshots, performance e Proventos recebidos ignorem expectativas.
# Resultado do gate remoto CORE-14.1 — 2026-08-30

O endpoint PostgreSQL direto do projeto não resolveu por DNS na rede testada. O pooler São Paulo resolveu em IPv4 e aceitou TCP na porta 5432, mas a Supabase CLI não autenticou com a credencial local existente. A primeira leitura no SQL Editor ocorreu com o compute em `Coming up…` e apresentou uma visão transitória incompleta. Após `Healthy`, o mesmo projeto/branch confirmou 1 usuário Auth, as tabelas Vestra e 109 operações.

Conclusão corrigida pela auditoria forense: o Development esperado foi localizado e está íntegro; não houve reset nem troca de projeto. Migration CORE-14, RLS, RPC, fixtures, dry-run e sincronização real não foram executados nesta auditoria somente leitura.
