# Decisoes Arquiteturais

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
