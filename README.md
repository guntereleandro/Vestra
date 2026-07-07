# Vestra

Gerenciador pessoal de investimentos para investidores brasileiros, com interface escura, responsiva e foco em acompanhamento patrimonial.

O Vestra funciona inteiramente no navegador. Nesta versão não há login, banco de dados ou integrações externas: operações, cotações e preferências ficam armazenadas no `localStorage` do dispositivo.

## Funcionalidades atuais

- Dashboard com patrimônio, valor investido, lucro ou prejuízo, rentabilidade e proventos.
- Registro, edição e exclusão de compras, vendas, dividendos, JCP e rendimentos.
- Operações como fonte da verdade para quantidade, custo, preço médio e proventos.
- Carteira consolidada automaticamente a partir do histórico de operações.
- Cotações manuais separadas dos preços históricos das operações.
- Aviso e fallback visual pelo preço médio quando uma cotação não foi informada.
- Cadastro mestre local com ticker, nome, tipo, setor e outros metadados.
- Autocomplete de ativos brasileiros conhecidos, com suporte a tickers personalizados.
- Busca e filtros em operações e posições da carteira.
- Exportação de backup em JSON.
- Importação validada com confirmação antes de substituir os dados.
- Limpeza segura apenas das chaves locais do Vestra.
- Navegação responsiva com sidebar no desktop e menu compacto no celular.

## Arquitetura

O projeto separa os principais domínios em duas camadas:

- `lib/data`: operações, cadastro mestre, cotações e persistência local.
- `lib/engine`: preço médio, consolidação da carteira, totais e validações financeiras.

Os componentes de interface consomem essas camadas sem concentrar regras financeiras complexas.

## Stack

- [Next.js](https://nextjs.org/) com App Router
- React
- JavaScript
- Tailwind CSS
- Lucide React
- `localStorage`

## Como rodar localmente

Pré-requisito: Node.js instalado.

```bash
git clone <URL-DO-REPOSITORIO>
cd vestra
npm install
npm run dev
```

A aplicação ficará disponível em [http://localhost:3000](http://localhost:3000).

Para validar a versão de produção:

```bash
npm run build
npm start
```

## Deploy na Vercel

Publique o repositório no GitHub e importe-o na [Vercel](https://vercel.com/new). A Vercel detectará o Next.js automaticamente e executará `npm run build`.

Não há variáveis de ambiente obrigatórias nesta versão.

## Privacidade e dados

Nenhuma informação financeira é enviada para servidores. Os dados permanecem no navegador em que foram cadastrados.

Como o `localStorage` pode ser apagado pelo navegador, use a função **Exportar dados** em Configurações para manter backups pessoais. Arquivos de backup não devem ser adicionados ao repositório.

## Próximos passos

- Autenticação e sincronização opcional entre dispositivos.
- Persistência em banco de dados.
- Atualização automática de cotações por API.
- Importação de notas de corretagem ou CSV.
- Integração com corretoras.
- Gráficos, relatórios e análises avançadas.
- Apoio à declaração de Imposto de Renda.
