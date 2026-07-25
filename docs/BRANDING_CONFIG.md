# Configuração de marca

Status: implementada na CORE-01, mantendo “Vestra” como nome interno e marca pública provisória.

## Estado atual

`lib/config/brandConfig.js` é a fonte central de identidade pública. `lib/config/publicEnvConfig.js` lê somente variáveis públicas e `lib/config/envConfig.js` é server-only para valores privados. `appConfig.js` mantém flags operacionais e referencia marca, locale, moeda e suporte sem duplicá-los.

## Contrato implementado

`brandConfig` concentra:

- nomes interno, público e curto;
- tagline, descrição e razão social;
- e-mails de suporte e contato;
- URLs do site, aplicação, Mercado e documentação;
- links sociais;
- caminhos de logos e favicons;
- locale e moeda padrão;
- template de título;
- prefixo compatível do arquivo de backup.

Campos indefinidos permanecem vazios. URLs públicas inválidas ou ausentes recebem fallback seguro e não interrompem o build.

## Ambientes

| Variável | Exposição | Uso atual |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | pública | URL da aplicação e links derivados |
| `NEXT_PUBLIC_SITE_URL` | pública | site/metadata base, com fallback para app |
| `NEXT_PUBLIC_APP_ENV` | pública | `development`, `preview`, `production` ou `test` |
| `BRAPI_TOKEN` | privada | provider BRAPI no servidor |
| `SUPABASE_URL` | privada | preparada, não usada antes da CORE-03 |
| `SUPABASE_ANON_KEY` | privada | preparada, não usada antes da CORE-03 |
| `SUPABASE_SERVICE_ROLE_KEY` | privada | preparada, não usada antes da CORE-03 |

Nenhuma credencial Supabase foi implementada. `envConfig.js` importa `server-only`, não retorna valores em diagnósticos e não pode ser importado por componentes clientes.

## Ocorrências por classificação

### Configuração central

- `lib/config/brandConfig.js`: fonte oficial da marca pública.
- `lib/config/publicEnvConfig.js`: somente ambiente público.
- `lib/config/envConfig.js`: somente servidor, incluindo segredos.
- `lib/config/appConfig.js`: versão exibida e flags funcionais; identidade é referenciada.
- `package.json` e `package-lock.json`: nome técnico do pacote. Pode permanecer interno até a preparação de release.
- `.env.example`: somente `BRAPI_TOKEN`; faltam variáveis de URL pública, suporte e Supabase futuras.

### Interface e metadados — centralizados

- `app/layout.js`: título, template, descrição, application name, locale, metadata base e ícones.
- shell, placeholders, Command Palette, busca, backup, objetivos, dashboard e conhecimento consomem `brandConfig`.
- o filename continua `vestra-backup-*`, mas o prefixo está centralizado para futura troca controlada.

### Persistência e arquivos — manter compatibilidade

- Prefixo `vestra:*` das chaves locais.
- `clearVestraData`.
- filename `vestra-backup-AAAA-MM-DD.json`.
- textos de migração dentro dos dados.

Esses itens não devem ser renomeados de imediato. Chaves e backup fazem parte de um contrato de dados; a marca pública futura deve ser desacoplada sem invalidá-los. Nomes de função podem permanecer internos até refatoração natural.

### Documentação e conteúdo — parametrizar no processo editorial

- `README.md`, `ROADMAP.md`, `docs/*`, `knowledge/*`.
- `lib/knowledge/catalog.js`: autor, FAQ, releases, glossário e textos.
- `knowledge/metadata.json`: versão e registros editoriais.

Documentos históricos podem manter “Vestra” como nome interno. Conteúdo apresentado ao usuário deve receber a marca pela configuração ou por tokens editoriais antes do lançamento.

### Mercado e validação — nome técnico interno

- `scripts/validate-brapi-integration.mjs`: ticker fictício `VESTRA999` e campo de log `layer: "vestra"`.
- comentários, nomes de funções e identificadores internos.

Podem permanecer internos, desde que não apareçam como marca pública ou dados incompatíveis.

## Como trocar a marca no futuro

1. Alterar nomes, tagline, descrição, e-mails, links e assets em `brandConfig.js`.
2. Configurar `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_SITE_URL` por ambiente.
3. Manter `internalProjectName` enquanto nomes técnicos ainda forem necessários.
4. Não renomear chaves `vestra:*`, funções legadas ou contratos de backup sem migração versionada.
5. Executar busca residual, lint, validadores e build.

Documentação histórica pode manter o nome vigente em sua época. Textos de runtime devem usar configuração.

## Critério de aceite

Uma troca de `appName`, domínio, e-mails, URLs e assets no contrato central deve atualizar as superfícies públicas mapeadas sem alterar chaves antigas, dados ou funcionamento.
