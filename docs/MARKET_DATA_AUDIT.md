# Auditoria de Dados de Mercado — CORE-13

Data da auditoria: 2026-08-22. Esta etapa é exclusivamente documental: não altera provider, contrato, cache, interface, engine, persistência ou plano da BRAPI.

> Implementação posterior: os problemas A desta auditoria foram tratados pela CORE-13 Mercado 2.0. O estado operacional está em `MARKET_DATA.md`, as capacidades em `MARKET_CAPABILITIES.md` e o histórico em `MARKET_HISTORY.md`. Este documento permanece como evidência anterior à implementação.

## Objetivo e método

O objetivo é definir o que o Mercado atual realmente entrega, distinguir defeito interno de limitação externa e estabelecer um escopo seguro para o Mercado 2.0. A auditoria combinou leitura integral da camada de mercado, rotas, consumidores e validadores; chamadas sanitizadas à BRAPI; consulta à documentação oficial do fornecedor; e inspeção responsiva do deployment público.

Nenhum token, corpo financeiro privado, cookie ou credencial foi registrado. Os testes reais usaram apenas tickers públicos.

## Arquitetura atual

```text
UI pública (/mercado e /mercado/[ticker])
  -> marketService
     -> busca/identidade no assets master e localProvider
     -> cotação persistente/manual quando fornecida pelo contexto
     -> quoteCache no navegador
     -> /api/market/search | assets/[ticker] | quotes | status
        -> brapiProvider server-only
           -> brapi.dev
```

- `lib/market/baseProvider.js` define apenas busca, ativo, cotação individual, lote e status. Não há contratos de histórico, demonstrações, composição, eventos ou proventos.
- `lib/market/marketService.js` é a fachada cliente, mas trata BRAPI como caminho especial em vez de resolver todas as capacidades por um registry uniforme.
- `lib/market/providers/localProvider.js` é o fallback permanente de identidade e cotação local.
- `lib/market/providers/brapiProvider.js` é server-only e concentra acesso externo, timeout, tamanho máximo de resposta, erros e normalização inicial.
- `lib/market/marketNormalizers.js` converte ativos e cotações para o formato do Vestra.
- `lib/market/quoteCache.js` mantém somente cotações temporárias em `vestra:marketCache:v1`.
- Não foi encontrado acesso direto à BRAPI em componentes. Fora do provider, somente o validador real acessa o fornecedor.

### Rotas internas

| Rota | Uso atual | Limite estrutural |
|---|---|---|
| `GET /api/market/search?q=` | autocomplete remoto | falha externa vira lista local/sem resultado na UI |
| `GET /api/market/assets/[ticker]` | perfil, indicadores e dividendos embutidos | não expõe histórico, demonstrações ou eventos completos |
| `GET /api/market/quotes?tickers=` | cotação individual ou lote | lote não se adapta ao limite real do plano |
| `GET /api/market/status` | estado exibido em Configurações | considera online quando o token existe; não verifica a BRAPI |

## Campos atualmente exibidos

### Identidade

- ticker, nome, tipo/classe, bolsa, setor, segmento;
- logotipo, descrição e website quando disponíveis;
- fonte e disponibilidade.

### Cotação

- preço atual, variação absoluta, variação percentual e horário de atualização;
- o contrato também carrega fechamento anterior, mas a página não o exibe;
- abertura, máxima, mínima e volume chegam na resposta básica da BRAPI, porém não são mapeados nem exibidos.

### Valuation e qualidade

- principais: P/L, P/VP, Dividend Yield e ROE;
- secundários: ROIC, margem líquida, margem EBITDA, liquidez corrente, VPA e LPA;
- a mesma grade é usada para ação, FII e ETF, mesmo quando a métrica não se aplica à classe.

### Proventos

- lista de tipo, valor e uma data normalizada;
- não existe fluxo próprio de atualização, histórico completo, paginação ou distinção visível entre data-com, data ex e pagamento;
- não existe suporte de UI/contrato para bonificação, subscrição, split, grupamento ou conversão.

### Histórico

Não há gráfico nem rota/contrato de histórico de preços no Vestra atual. Qualquer aparência de “histórico” na página limita-se à lista curta de dividendos retornada junto ao ativo.

## Inventário: origem e classificação dos campos

Legenda de cobertura de campo:

- **A** — BRAPI entrega, mas o Vestra não mapeia ou não exibe;
- **B** — BRAPI entrega em endpoint/módulo diferente do usado;
- **C** — não foi confirmado como entregue pela BRAPI;
- **D** — existe, mas é restrito pelo plano;
- **E** — não é aplicável à classe;
- **F** — pode ser calculado internamente com insumos confiáveis;
- **G** — exige ou se beneficia de outra fonte.

| Grupo/campo | Estado no Vestra | Classificação | Observação |
|---|---|---:|---|
| preço, variação diária | mapeado e exibido | — | cobertura básica real confirmada |
| abertura, máxima, mínima, volume | descartado | A | presente nas respostas básicas testadas |
| fechamento anterior | mapeado, não exibido | A | normalizador converte ausência em zero |
| histórico OHLCV/adjustedClose | inexistente | B/D | endpoint próprio; janela geral depende do plano |
| P/L, P/VP, DY, ROE | mapeado | D/E | módulos avançados não cobrem livremente todos os tickers/classes |
| EV/EBITDA, dívida, payout, crescimento | inexistente | B/D/F/E | requer módulos/demonstrações e regra explícita de cálculo |
| margem líquida/EBITDA, ROIC, liquidez | mapeado quando recebido | D/E | margem EBITDA não é adequada a bancos; grade atual não diferencia |
| dados detalhados de FII | inexistente | B/D | patrimônio, cotistas, vacância, portfólio e histórico são módulos próprios Pro |
| composição/índice de ETF | inexistente | C/G | não confirmada no contrato usado; requer fonte especializada/oficial |
| dividendos de ações/FIIs | parcial | B/D | provider usa coleção legada embutida e limita a 24 itens |
| bonificações/subscrições | descartado | B/D | endpoint de dividendos de ações possui coleções próprias |
| split/grupamento/conversão | inexistente | C/G | não deve ser inferido de preço ou compra/venda |
| logo, descrição, website | parcial | D | depende de módulo de perfil |

## Cobertura real da BRAPI

### Amostra executada

Foram consultados, sem registrar token:

- ações: PETR4, VALE3, ITUB4, BBAS3 e WEGE3;
- FIIs: MXRF11, HGLG11 e KNCR11;
- ETFs: IVVB11, BOVA11 e GOLD11;
- diversidade adicional: AAPL34 (BDR) e SANB11 (unit).

Todos retornaram cotação básica com preço, variação, máxima, mínima, abertura, fechamento anterior e volume. A busca real encontrou os nomes/tickers esperados. Isso confirma cobertura básica, não cobertura irrestrita de módulos avançados.

### Cobertura por classe

| Classe | Cobertura básica confirmada | Cobertura avançada observada | Lacuna do Vestra |
|---|---|---|---|
| Ação | cotação e busca | PETR4, VALE3 e ITUB4 responderam no ambiente sandbox; BBAS3 e WEGE3 receberam 403 | descarta OHLCV diário; não usa endpoints v2 separados; fundamentais incompletos |
| FII | cotação e busca | módulos detalhados são Pro; MXRF11/HGLG11 têm tratamento sandbox em endpoints específicos, KNCR11 recebeu 403 | ticker terminado em `11` funciona como FII, mas indicadores próprios não existem |
| ETF | cotação e busca | sem fundamentais avançados na amostra | o inferidor classifica ticker terminado em `11` como FII antes de respeitar `ETF`; falta composição e métricas adequadas |
| BDR | cotação e busca confirmadas com AAPL34 | não auditada como cobertura avançada geral | não há experiência específica nem vínculo com ativo subjacente/moeda |
| Unit | cotação e busca confirmadas com SANB11 | não auditada como cobertura avançada geral | sufixo `11` pode ser classificado incorretamente como FII |

Os resultados amplos de PETR4/VALE3/ITUB4 e históricos longos de PETR4 são permissões de sandbox documentadas pelo fornecedor. Não devem ser tratados como direito do plano Free para qualquer ticker.

### Plano, limites e custo operacional

O endpoint de uso confirmou plano Free e franquia de 15.000 requisições por ciclo. A documentação oficial consultada informa, de forma resumida:

| Plano | Requisições/mês | Tickers por requisição | Histórico geral | Atraso indicativo de ações |
|---|---:|---:|---|---|
| Free | 15.000 | 1 | até 3 meses | cerca de 30 min |
| Startup | 150.000 | 10 | até 1 ano | cerca de 15 min |
| Pro | 500.000 | 20 | completo | cerca de 5 min |

Os limites e preços são externos e podem mudar; devem ser consultados antes da implementação. O Vestra configura lote de até 20 tickers, incompatível com o limite geral de 1 ticker do Free. Nos testes, lotes sandbox passaram, mas lotes comuns com múltiplos tickers retornaram 400. Portanto, a atualização de uma carteira pode falhar por chunk inteiro.

Referências oficiais: [documentação BRAPI](https://brapi.dev/docs), [histórico de ações](https://brapi.dev/docs/acoes/historico), [FIIs](https://brapi.dev/docs/fiis), [dividendos de FIIs](https://brapi.dev/docs/fiis/dividendos) e [limites dos planos](https://brapi.dev/faq/quais-as-limitacoes).

## Normalização e semântica

### Defeitos internos encontrados

1. `safeNumber` converte `null`/`undefined` de variação e fechamento anterior em `0`. Ausência vira dado real e contradiz o README.
2. `updatedAt` ausente recebe o horário atual. Isso fabrica frescor e pode ocultar dado sem timestamp.
3. O inferidor verifica “ticker termina em 11” junto com FII antes de respeitar ETF. IVVB11, BOVA11, GOLD11 e units podem ser classificados como FII.
4. O provider colapsa várias datas de provento em uma única data. A semântica de aprovação, posição, ex e pagamento é perdida.
5. Dividendos são limitados a 24 e eventos de bonificação/subscrição não entram no contrato normalizado.
6. Falha ao interpretar JSON é reportada como erro de rede, prejudicando diagnóstico.
7. A página do ativo dispara busca de ativo e cotação em paralelo; o caminho atual pode repetir chamadas externas e não grava a cotação do detalhe no cache.

### Zeros legítimos

Zero só é dado válido quando a origem o fornece explicitamente. Campos indisponíveis devem permanecer `null`, carregar disponibilidade e fonte, e nunca receber `0`, “agora” ou percentuais inferidos sem base. Percentuais devem ter uma convenção única: pontos percentuais no contrato de UI, nunca mistura silenciosa entre `0,12` e `12`.

## Histórico de preços

O teste sanitizado de PETR4 retornou dados para `1d`, `5d`, `1mo`, `6mo`, `1y`, `5y` e `max`, com OHLCV e `adjustedClose`. Essa amostra sandbox prova capacidade técnica do endpoint, não cobertura do Free para todos os ativos.

Antes de implementar gráficos, o contrato precisa registrar:

- intervalo e range solicitados e efetivamente atendidos;
- timezone e data de pregão;
- `close` e `adjustedClose` sem substituir um pelo outro;
- lacunas, feriados, ausência e ordenação;
- fonte, timestamp de obtenção e eventual atraso;
- semântica validada de ajustes por splits e proventos;
- limite de plano e redução explícita de range, nunca silenciosa.

Não foi confirmada, para todas as classes, a mesma política de ajuste, profundidade histórica ou granularidade. Isso é bloqueio de contrato, não justificativa para fabricar séries.

## Proventos e eventos corporativos

- A BRAPI possui endpoints v2 separados de dividendos para ações e FIIs; os de FII são Pro, com sandbox parcial.
- O endpoint de ações documenta dividendos em dinheiro, bonificações e subscrições em coleções distintas.
- O Vestra usa atualmente dividendos legados embutidos no detalhe e perde datas/eventos estruturados.
- Split, grupamento, conversão/incorporação e outros eventos não foram confirmados como série completa e confiável no contrato atual.
- Dados de mercado jamais devem ser convertidos automaticamente em operações da carteira. Eventos corporativos exigem reconciliação, fonte auditável e regra de domínio já definida nas ADRs de operações.

Fontes complementares possíveis: B3/licenciamento de Market Data para eventos e referência oficial; CVM Dados Abertos para demonstrações, informes e dados periódicos; e documentos de RI/administrador/gestor para confirmação. A CVM é oficial e aberta, mas não é feed de cotação em tempo real; B3 pode exigir contrato e custo comercial; documentos de emissores são fragmentados e exigem ingestão/manutenção.

## Dados calculáveis internamente

Podem ser derivados sem nova fonte apenas quando todos os insumos, períodos e convenções estiverem presentes:

- margem líquida = lucro líquido / receita;
- margem EBITDA = EBITDA / receita;
- payout = proventos elegíveis / lucro atribuível, com janela definida;
- crescimento anual e CAGR de receita, lucro, patrimônio ou proventos;
- dívida líquida/EBITDA;
- ROIC, desde que NOPAT, dívida, caixa, patrimônio e convenção fiscal estejam definidos;
- P/L e P/VP a partir de preço e indicadores por ação compatíveis em data/período;
- crescimento de dividendos a partir de série normalizada sem duplicidades.

Não são calculáveis com segurança apenas com o contrato atual: valor justo, score, recomendação, continuidade garantida de eventos corporativos, composição de ETF, vacância/qualidade de FII, risco de crédito e rentabilidade total ajustada sem histórico/eventos validados.

## Cache, atualização e fallback

### Cache atual

- somente cotações, no navegador, TTL de 30 minutos;
- chave `vestra:marketCache:v1`, fora do backup;
- entradas expiradas permanecem armazenadas até limpeza manual/sobrescrita;
- sem cache server-side, deduplicação de requisições concorrentes, stale-while-revalidate, cache negativo ou observabilidade;
- `automaticQuoteRefreshMinutes` está configurado, mas não foi encontrado agendamento automático que o utilize;
- o detalhe do ativo não persiste sua cotação no cache pelo fluxo auditado.

### Prioridade e fallback

O objetivo documentado é `manualOverride > automática válida > cache válido > preço médio sinalizado`. O caminho isolado de `getMarketQuote` retorna uma cotação manual disponível antes de verificar explicitamente `manualOverride`, criando risco de precedência divergente. O fallback local preserva utilidade e não inventa cotação quando ela não existe, o que deve permanecer.

Falhas remotas de busca e detalhe são frequentemente absorvidas como fallback. Isso evita quebra total, mas também impede distinguir “ativo local sem dado externo”, “plano bloqueou”, “token inválido”, “rate limit” e “provider fora”. O fallback deve carregar estado e motivo sanitizados.

## Erros, segurança e produção

Pontos fortes:

- `BRAPI_TOKEN` é privado e lido em módulo server-only;
- componentes chamam rotas internas, não o fornecedor;
- mensagens são sanitizadas e o corpo é limitado a 500 KB;
- timeout de 7 segundos e mapeamento de 401/403/404/429/5xx;
- token não foi encontrado em backup, localStorage ou bundle cliente.

Riscos e melhorias necessárias:

- o token é enviado como query string à BRAPI; embora não seja logado pelo Vestra, URLs podem aparecer em infraestrutura intermediária. Preferir o mecanismo oficial mais seguro suportado pelo fornecedor e manter redaction;
- `/api/market/status` não testa conectividade: token presente é mostrado como online;
- não há métricas sanitizadas por erro/status, consumo de cota, latência ou cache hit;
- chamadas públicas podem consumir a franquia sem rate limit próprio por IP/sessão;
- busca com menos de dois caracteres é local, mas detalhe e cotações continuam expostos publicamente;
- o plano Free e o chunk de 20 tornam consumo e falha pouco previsíveis.

## UX e auditoria responsiva

Em `/mercado`, as larguras 320, 360, 390, 430, 768 e 1440 px não apresentaram overflow horizontal. O campo manteve `font-size: 16px`, largura contida e navegação sem overflow. A hierarquia pública, foco e texto de limitação do plano permanecem legíveis.

Problemas observados no deployment Production em 2026-08-22:

- a pesquisa por PETR4 não apresentou resultados durante a espera inicial nem indicou que a resposta remota ainda estava pendente;
- pressionar Enter durante esse estado não abriu o ativo no teste publicado;
- acesso direto a `/mercado/PETR4` permaneceu por mais de 30 segundos em “Preparando uma visão clara do ativo”, sem progresso, retry ou erro de console; depois da espera prolongada, o detalhe carregou corretamente;
- a latência prolongada impede uma experiência confiável e deixa o usuário sem distinguir lentidão, timeout ou indisponibilidade.

O código possui skeleton, vazio e erro, mas a execução publicada demonstrou que uma resposta muito lenta não alcança timeout nem estado recuperável em tempo útil. Isso é bug de resiliência/UX do Vestra e bloqueia considerar a experiência pública confiável, ainda que a origem da latência esteja no provider ou na infraestrutura.

Quando o detalhe responde, a mesma grade para todas as classes produz excesso de “Dado indisponível” e indicadores irrelevantes. Mercado 2.0 deve selecionar seções por capacidade/classe, sem esconder indisponibilidade real.

## Arquitetura futura de providers

O provider deve declarar capacidades, não apenas um nome:

```text
search | quote | quoteBatch | profile | fundamentals
history | cashDividends | corporateActions | composition | status | usage
```

Cada resposta deve incluir `provider`, `sourceTimestamp`, `fetchedAt`, `availability`, `limitation`, `plan` quando seguro, e `stale`. O registry deve resolver capability por classe, permitir composição de fontes e impedir fallback sem rastreabilidade. UI e engine continuam sem importar SDK/API externa.

Não se recomenda trocar de fonte antes de medir três opções:

1. **BRAPI Pro/Startup:** menor custo de integração; validar cobertura real por classe e contrato/preço vigente.
2. **CVM Dados Abertos:** oficial, gratuito e adequado a dados periódicos/fundamentos; exige pipeline, normalização e não substitui cotações.
3. **B3 Market Data/UP2DATA:** fonte oficial para mercado/eventos; custo, licenciamento e operação são significativamente maiores.
4. **RI/administradores/gestores:** melhor para evidência específica, porém fragmentado e caro de manter automaticamente.

## Classificação de problemas

Aqui A–E representam prioridade de engenharia, não a legenda de cobertura de campos.

### A — bloqueia Mercado 2.0 confiável

| Problema | Impacto | Recomendação |
|---|---|---|
| detalhe público passa mais de 30 s em loading e busca não comunica resposta pendente | Mercado parece inutilizável e não explica a demora | medir as duas chamadas, eliminar duplicação e garantir timeout total, erro e retry |
| lote de até 20 em plano Free de 1 ticker | atualização de carteira falha por lote | tornar chunk consciente da capacidade/plano e preservar sucesso parcial seguro |
| ETF/unit terminado em `11` inferido como FII | indicadores, rótulos e experiência semanticamente errados | priorizar tipo explícito e criar normalização por classe com testes |
| ausência convertida em zero e timestamp atual | dado falso, frescor falso e decisões incorretas | preservar `null` e exigir timestamp/estado explícitos |

### B — alta

- contratos/rotas inexistentes para histórico, eventos, dividendos v2 e fundamentais por classe;
- campos básicos (OHLCV) descartados;
- fallback silencioso não distingue erro, plano, rate limit e ausência;
- datas de proventos colapsadas e eventos estruturados descartados;
- chamadas duplicadas no detalhe, sem cache/deduplicação;
- precedência de cotação manual potencialmente divergente de `manualOverride`.

### C — média

- status não verifica o provider;
- cache expirado não é purgado e não há cache server-side/SWR;
- configuração de refresh não possui agendamento encontrado;
- grade única de indicadores para classes distintas;
- sem observabilidade sanitizada de consumo, latência, erros e cache.

### D — baixa

- mensagens e acentuação de alguns textos públicos podem ser revisadas junto ao novo conteúdo;
- Central de Dados poderia explicar melhor timestamp, atraso, fonte e cache depois que o contrato os fornecer;
- autocomplete deve anunciar explicitamente erro e ausência sem poluir a experiência.

### E — pode esperar após o Core/Mercado 2.0 inicial

- múltiplos fornecedores automáticos com failover comercial;
- composição completa de ETF e análises avançadas de FII;
- demonstrações completas e séries financeiras longas;
- recomendações, scores, valor justo e análise fundamentalista — continuam fora do Core.

## Escopo recomendado para a implementação da CORE-13 Mercado 2.0

Entrega incremental sugerida:

1. corrigir tipos, nulls/timestamps, loading/erros e lote conforme capacidade; adicionar regressões;
2. formalizar capability registry e envelope de fonte/disponibilidade sem mudar a engine;
3. mapear e exibir cotação básica completa por classe, com cache/deduplicação e consumo observável;
4. adicionar histórico de preços com ranges compatíveis com o plano e sem redução silenciosa;
5. integrar dividendos/eventos estruturados em contrato separado das operações da carteira;
6. adicionar fundamentos por classe somente após decidir plano/fonte e validar cobertura/custo.

Critério de aceite inicial: busca e detalhe nunca ficam presos; nenhuma ausência vira zero; ações, FIIs, ETFs, BDRs e units são classificados corretamente; atualização respeita o plano; fonte, timestamp, atraso e limitação são visíveis; fallback é rastreável; testes reais e simulados, lint e build passam.
