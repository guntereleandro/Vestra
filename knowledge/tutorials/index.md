# Tutoriais

Durante a validação de 30 dias, registre diariamente o uso do Dashboard, operações, proventos, cotações, carteira, histórico, erros e qualquer necessidade de recorrer a outro serviço.

Em Proventos, registre dividendos, JCP e rendimentos, filtre por ativo, tipo, ano e mês e acompanhe totais. Esses registros são operações da fonte ativa.

O histórico patrimonial segue a fonte ativa. Na Conta, use **Gerar prévia** em “Importar snapshots locais” antes de confirmar uma cópia manual para a carteira Supabase. Datas divergentes são exibidas como conflito e não são substituídas.

Selecione um tutorial pela pesquisa, pela Command Palette ou por sua categoria. Cada conteúdo possui URL própria e é entregue pelo serviço público da Central. O repositório local continua sendo o fallback, sem alterar a navegação do usuário.

No Mercado, a pesquisa combina a listagem disponível da BRAPI com o catálogo local. Indicadores avançados podem depender do plano do provedor; nesses casos, cotação e dados básicos permanecem disponíveis.

Artigos oficiais: Dashboard, Carteira, Operações, Mercado, Objetivos, Diagnósticos, Performance, Perfil, Estratégia, Backup e Conta e acesso. Os metadados canônicos estão em `knowledge/metadata.json`.

Conta e acesso explica cadastro, confirmação de e-mail, login, logout e recuperação de senha. A autenticação não sincroniza nem remove os dados financeiros locais nesta fase.
CORE-07 adiciona à Conta uma comparação entre operações locais e remotas. A importação exige confirmação, baixa backup antes da escrita, não remove dados e não sobrescreve conflitos.

Na CORE-08, Conta permite escolher explicitamente Local ou Supabase. A escolha remota exige confirmacao, mostra carteira, contagens, conflitos e permissao. Viewer usa somente leitura; sair limpa o cache remoto sem apagar dados locais.

Na CORE-09, a Landing e o Mercado formam a area publica. A area patrimonial exige login, preserva a pagina desejada e conduz o primeiro acesso por um onboarding curto para criar a primeira carteira.
