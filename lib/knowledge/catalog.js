import { brandConfig, formatBrandText } from "../config/brandConfig.js";

const updatedAt = "2026-07-27", version = "0.8.2";
const article = (id, slug, category, title, description, content, tags, relatedIds = []) => ({
  id,
  slug,
  category,
  title,
  description,
  tags,
  version,
  updatedAt,
  content,
  relatedIds,
  status: "published",
  visibility: "public",
  author: brandConfig.appName,
  revision: 1,
});

export const tutorials = [
  article("tutorial-dashboard", "dashboard", "tutorials", "Dashboard", "Entenda patrimônio, evolução, alocação e fatos recentes.", ["O Dashboard reúne a visão geral do patrimônio.", "Use a timeline para observar mudanças entre registros e os cards para localizar carteira, proventos e objetivos.", "Insights são fatos calculados localmente e não recomendações."], ["dashboard", "patrimônio"]),
  article("tutorial-carteira", "carteira", "tutorials", "Carteira", "Leia posições, performance e diagnósticos em uma única área.", ["A Carteira é consolidada a partir das operações.", "Aportes são separados de rentabilidade na Performance Patrimonial.", "Diagnósticos gerais, estratégia, perfil e padrões comportamentais aparecem em blocos distintos."], ["carteira", "posições", "performance"]),
  article("tutorial-operacoes", "operacoes", "tutorials", "Operações", "Registre compras, vendas e proventos que formam a fonte da verdade.", ["Informe ticker, data, tipo, quantidade e valores.", "Compras e vendas alteram posição e custo; dividendos, JCP e rendimentos alimentam proventos.", "Revise os dados antes de salvar porque as demais áreas derivam deste histórico."], ["operações", "compras", "proventos"]),
  article("tutorial-mercado", "mercado", "tutorials", "Mercado", "Pesquise ativos e consulte dados disponíveis do provedor.", ["A busca aceita ticker exato, ticker parcial e nome sem depender de acentos, combinando a listagem da BRAPI com o catálogo local.", "Cotações automáticas passam por rotas internas e possuem fallback local.", "Indicadores avançados dependem dos módulos liberados pelo plano da BRAPI. Quando não estão disponíveis, cotação e dados básicos continuam funcionando e a limitação é indicada sem substituir campos por zero."], ["mercado", "cotações", "indicadores"]),
  article("tutorial-objetivos", "objetivos", "tutorials", "Objetivos", "Acompanhe metas patrimoniais, renda passiva e objetivos manuais.", ["Crie uma meta e defina seu valor de referência.", "O progresso automático usa os totais locais correspondentes.", "Marcos podem aparecer na jornada patrimonial."], ["objetivos", "metas"]),
  article("tutorial-diagnosticos", "diagnosticos", "tutorials", "Diagnósticos", "Interprete scores, confiança, evidências e limitações.", ["Scores são descritivos e variam de 0 a 100.", "Confiança indica cobertura dos dados; limitações mostram o que não pôde ser concluído.", "Nenhum diagnóstico é recomendação financeira."], ["diagnósticos", "scores", "confiança"]),
  article("tutorial-performance", "performance", "tutorials", "Performance Patrimonial", "Entenda a origem da evolução e o maior drawdown.", ["Crescimento é separado em aportes líquidos, valorização e proventos.", "Rentabilidade não inclui capital novo.", "O drawdown compara cada registro ao maior patrimônio anterior."], ["performance", "drawdown", "rentabilidade"]),
  article("tutorial-perfil", "perfil", "tutorials", "Perfil e tolerância a risco", "Registre contexto pessoal por um questionário determinístico.", ["Responda experiência, horizonte, liquidez, renda, perdas, reserva e objetivo.", "O perfil calculado produz referências transparentes.", "Parâmetros só alteram a estratégia após confirmação explícita."], ["perfil", "risco"]),
  article("tutorial-estrategia", "estrategia", "tutorials", "Estratégia da carteira", "Defina limites, preferências e alocação-alvo.", ["Limites e metas são referências declaradas por você.", "A alocação-alvo preenchida deve somar 100%.", "Divergências estratégicas ficam separadas dos diagnósticos gerais."], ["estratégia", "alocação"]),
  article("tutorial-backup", "backup", "tutorials", "Backup e restauração", "Exporte, importe ou limpe dados locais com segurança.", ["O backup inclui operações, cotações, histórico, estratégia e perfil.", "A importação substitui os dados após confirmação.", formatBrandText("A limpeza remove somente chaves do {appName} neste navegador."), "A camada de repositórios mantém o mesmo formato local e não cria uma segunda cópia dos dados."], ["backup", "dados locais"]),
  article("tutorial-conta", "conta-e-acesso", "tutorials", "Conta e acesso", "Crie uma conta, confirme o e-mail e gerencie sua sessão.", ["Use Cadastro para criar uma conta com e-mail e senha e confirme o endereço pelo link recebido.", "A área Conta garante seu profile e permite criar espaços de carteira com permissões.", "Use Verificar dados para comparar Local e Supabase. A importação só ocorre após confirmação e baixa um backup.", "Conflitos não são sobrescritos, e o Provider Local continua ativo.", "Sair encerra a sessão, mas não apaga seus dados locais."], ["conta", "login", "senha", "carteiras", "dados locais"]),
];

const conceptsData = [
  ["pl", "P/L", "Preço dividido pelo lucro por ação. Relaciona preço de mercado e lucro, sem indicar isoladamente atratividade."],
  ["pvp", "P/VP", "Preço dividido pelo valor patrimonial por ação. Compara valor de mercado e patrimônio contábil."],
  ["roe", "ROE", "Retorno sobre patrimônio líquido. Relaciona lucro e capital dos acionistas."],
  ["roic", "ROIC", "Retorno sobre capital investido. Observa eficiência do capital empregado na operação."],
  ["dividend-yield", "Dividend Yield", "Proventos por ação em relação ao preço. É histórico e não constitui projeção."],
  ["drawdown", "Drawdown", "Queda entre um pico patrimonial e o menor valor posterior observado."],
  ["diversificacao", "Diversificação", "Distribuição do patrimônio entre ativos, classes e outras dimensões conhecidas."],
  ["preco-medio", "Preço Médio", "Custo médio das unidades mantidas, recalculado a partir das operações registradas."],
  ["rentabilidade", "Rentabilidade", "Variação atribuída ao desempenho, separada de aportes e retiradas de capital."],
];
export const concepts = conceptsData.map(([slug, title, text]) => article(`concept-${slug}`, slug, "concepts", title, text, [text, "O indicador deve ser lido com contexto, período, fonte e limitações dos dados."], [title, "indicador"]));

export const faq = [article("faq-areas", "areas-atuais", "faq", "Perguntas frequentes", "Respostas rápidas sobre as áreas atuais.", [
  "Onde ficam meus dados? O Provider Local continua no navegador; operações podem ter cópia remota após importação manual.",
  "Como a carteira é formada? A partir das operações registradas.",
  "Cotação ausente vira zero? Não; a interface sinaliza indisponibilidade ou fallback.",
  "O Mercado funciona offline? O catálogo local permanece como fallback.",
  "Como acompanho metas? Pela área Objetivos e seus indicadores de progresso.",
  "Scores são recomendações? Não; são descrições determinísticas acompanhadas de confiança.",
  "Aportes contam como rentabilidade? Não; a Performance os apresenta separadamente.",
  "O perfil altera minha estratégia? Somente após prévia e confirmação explícita.",
  "A estratégia é obrigatória? Não; diagnósticos gerais continuam disponíveis.",
  "O backup inclui preferências? Sim, incluindo estratégia e perfil de risco.",
  "Como abrir um artigo específico? Use os cards, a pesquisa, a ajuda contextual ou a Command Palette; todos levam à URL própria do conteúdo.",
  "De onde vem o conteúdo da Central? Nesta versão, de um repositório local acessado por um contrato único, preparado para provedores futuros.",
  "Como os dados financeiros são acessados? Os fluxos essenciais usam contratos assíncronos com provider local, preservando as mesmas chaves e o backup atual.",
  "Criar uma conta envia minha carteira? Não. Importar operações exige confirmação explícita na área Conta.",
  "O que é a carteira mostrada em Conta? É o espaço remoto de acesso, permissões e destino escolhido para importação.",
  "Sair da conta apaga meus dados? Não. Logout encerra somente a sessão de autenticação.",
  "Como redefino minha senha? Use Esqueci minha senha na página Entrar e siga o link enviado ao e-mail.",
  formatBrandText("Por que alguns indicadores de mercado não aparecem? Alguns módulos dependem do plano da BRAPI; o {appName} mantém cotação e dados básicos e identifica o indicador como indisponível no provedor atual."),
], ["faq", "dúvidas", "funcionalidades"] )];

export const releases = [article("release-history", "versoes-0-1-a-0-8", "release-notes", "Versões 0.1 a 0.8.2", formatBrandText("Evolução pública do {appName}."), [
  "0.1 — Fundação: operações, carteira e persistência local.",
  "0.2 — Visualização: histórico, gráficos e detalhes de ativos.",
  "0.3 — Mercado: domínio de mercado, busca, cache e providers.",
  "0.4 — Experiência: Dashboard 2.0, jornada, insights e recordes.",
  "0.5 — Objetivos: metas patrimoniais, renda passiva e marcos.",
  "0.6 — Mercado público: pesquisa e experiência pública do ativo.",
  "0.7 — Inteligência determinística: diagnósticos, estratégia, perfil, comportamento e performance.",
  "0.8.0 — Central de Conhecimento: documentação oficial pesquisável e ajuda contextual.",
  "0.8.1 — Artigos individuais: URLs próprias, conteúdos relacionados e integração com a Command Palette.",
  "0.8.2 — Knowledge Repository: contrato desacoplado, schema normalizado e fallback local.",
  "CORE-02 — Repositórios assíncronos: contratos de dados, provider local e serviços sem alteração de armazenamento.",
  "CORE-04 — Autenticação e sessão: e-mail e senha, PKCE, recuperação, cookies SSR e proteção incremental de Conta, sem sincronização financeira.",
  "CORE-07 — Operações persistentes: importação manual, backup prévio, reconciliação por UUID e RLS, mantendo o Provider Local.",
], ["releases", "versões", "histórico"] )];

export const glossary = [article("glossary-financial", "glossario-financeiro", "glossary", "Glossário financeiro", formatBrandText("Termos usados no {appName}."), ["Aporte — capital adicionado à carteira.", "Ativo — instrumento financeiro identificado por ticker.", "Auth User — identidade mantida pelo Supabase Auth; não é o Profile de negócio nem contém a carteira.", "Carteira remota — espaço de autorização com membros e papéis; ainda não contém operações na CORE-05.", "Cotação — preço de referência do ativo.", "Drawdown — queda desde um pico observado.", "Owner — membro com permissão administrativa sobre a carteira remota.", "Patrimônio — valor atual consolidado das posições.", "Profile — dados públicos mínimos associados ao Auth User.", "Proventos — dividendos, JCP e rendimentos registrados.", "Rentabilidade — variação de desempenho separada dos aportes.", "Sessão — estado temporário de acesso autenticado mantido em cookies seguros.", "Ticker — código de negociação ou identificação do ativo.", "Valorização — componente residual da evolução após fluxos e proventos."], ["glossário", "termos"] )];
export const changelog = [article("changelog-product", "historico-produto", "changelog", "Histórico do produto", "Registro resumido de mudanças.", ["CORE-05 — Schema versionado de profiles, carteiras e membros, RLS, criação atômica e repositories remotos; Provider Local financeiro preservado.", "CORE-04 — Autenticação por e-mail e senha, confirmação, recuperação, sessão SSR, callback PKCE e rota Conta protegida; dados financeiros permanecem locais.", "CORE-02 — Contratos assíncronos para dados essenciais, adapters locais, registry, serviços e validação isolada.", "Correção crítica de Mercado — conexão HTTPS local, timestamp ISO da BRAPI e cotação básica integrada à resposta do ativo.", "Recuperação funcional — Pesquisa de mercado combinada, mapeamento dos módulos reais da BRAPI e fallback para restrições de plano.", "0.8.2 — Repositório de conhecimento, contrato público, schema editorial e fallback local.", "0.8.1 — Artigos individuais, relacionados, links normalizados e integração com a Command Palette.", "Consulte Release Notes para marcos por versão.", "Mudanças futuras devem atualizar tutorial, FAQ, releases, glossário quando aplicável e metadata.json."], ["changelog", "mudanças"] )];
const operationsGlossary = [article("glossary-operations-sync", "operacoes-e-sincronizacao", "glossary", "Operações e sincronização", "Termos da persistência de operações.", ["Conflito de operação — mesmo UUID com conteúdos diferentes no Local e no Supabase; não é resolvido automaticamente.", "Importação segura — envio manual e idempotente de registros existentes somente no Local, após prévia e backup.", "Provider Local — origem que continua alimentando a engine durante a CORE-07."], ["operações", "sincronização", "UUID"])];
export const knowledgeArticles = [...tutorials, ...concepts, ...faq, ...releases, ...glossary, ...operationsGlossary, ...changelog];
