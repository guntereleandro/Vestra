# Decisoes Arquiteturais

## 2026-07-14 — Central acessada por repositório

Decisão:

Interface, pesquisa, Command Palette, rotas e ajuda contextual consomem somente o serviço público de conhecimento. O catálogo permanece como fonte local atrás de um contrato de repositório e é o fallback para providers futuros.

Motivo:

Permitir conteúdo remoto e publicação administrativa futura sem acoplar componentes à origem, preservando funcionamento local e URLs estáveis.

---

## 2026-07-14 — Aportes separados de rentabilidade

Decisão:

A Engine de Performance Patrimonial trata aportes e retiradas como fluxos de capital. Rentabilidade deriva apenas da valorização residual, separada também dos proventos.

Motivo:

Explicar a evolução sem atribuir capital novo ao desempenho dos ativos.

---

## 2026-07-13 — Comportamento como padrão observado

Decisão:

Diagnósticos comportamentais descrevem somente padrões mensuráveis do histórico de operações. Nenhuma intenção, emoção ou julgamento é inferido.

Motivo:

Manter fatos auditáveis e distinguir atividade registrada de interpretações psicológicas.

---

## 2026-07-13 — Perfil de risco como contexto

Decisão:

O perfil é calculado por regras determinísticas e influencia apenas diagnósticos contextuais. Parâmetros derivados somente substituem partes da estratégia após prévia e confirmação explícita.

Motivo:

Separar respostas declaradas, referências calculadas e escolhas estratégicas persistentes, evitando sobrescritas implícitas.

---

## 2026-07-13 — Estratégia declarada pelo usuário

Decisão:

Preferências pessoais são dados locais validados e entram na engine somente como parâmetros opcionais. Diagnósticos gerais e diagnósticos da estratégia permanecem identificados separadamente.

Motivo:

Preservar o significado das regras gerais e permitir comparações transparentes com referências definidas pelo usuário, sem linguagem prescritiva.

---

## 2026-07-13

### Diagnosticos determinísticos antes de IA

Decisao:

A IA futura não será fonte primária dos diagnósticos. Ela receberá fatos calculados por engines determinísticas e explicará esses fatos ao usuário.

Motivo:

Manter cálculos auditáveis, reproduzíveis e separados da camada de explicação.

---

## 2026-07-10

### Operacoes sao a fonte da verdade

Motivo:

Evitar inconsistencias entre ativos e operacoes.

---

### Cotacoes ficam separadas das operacoes

Motivo:

O preco pago nunca representa a cotacao atual.

---

### Engine financeira separada da interface

Motivo:

Permitir reutilizacao futura em aplicativo movel.

---

### Painel administrativo

Decisao:

Sera implementado somente apos existir banco de dados e autenticacao.

---

### Interface e engine nao dependem diretamente de API de mercado

Decisao:

A interface e a engine nunca dependem diretamente de uma API de mercado especifica.

Motivo:

Permitir trocar ou combinar provedores sem alterar regras financeiras ou componentes centrais.

---

### Local provider como fallback permanente

Decisao:

O provedor local baseado no cadastro mestre e nas cotacoes manuais permanece sempre disponivel.

Motivo:

O Vestra deve continuar funcionando offline e sem dependencia obrigatoria de API externa.

---

### Cache de mercado e temporario

Decisao:

O cache `vestra:marketCache:v1` nao e fonte permanente da carteira e nao e necessario para restaurar backup.

Motivo:

Evitar confundir dados dinamicos expiraveis com dados financeiros registrados pelo usuario.

---

### brapi.dev somente no servidor

Decisao:

A integracao com brapi.dev deve passar por rotas internas do Next.js e ler apenas `BRAPI_TOKEN`.

Motivo:

Impedir exposicao de credenciais no bundle do navegador.

---

### Prioridade manual sobre automatica

Decisao:

Quando `manualOverride` estiver ativo, a cotacao manual prevalece sobre a automatica.

Motivo:

Preservar controle explicito do usuario sobre dados financeiros locais.
