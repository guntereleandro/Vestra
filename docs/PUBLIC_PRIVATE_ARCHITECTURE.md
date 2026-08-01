# Arquitetura publica e privada

## Objetivo

O site explica o produto; a aplicacao administra patrimonio. A Landing vive em `/` e usa navegacao publica. O Dashboard vive em `/dashboard` e usa o shell privado existente.

## Rotas publicas

- `/`
- `/mercado` e `/mercado/[ticker]`
- rotas de entrada, cadastro, confirmacao e recuperacao
- `/auth/callback`
- `/api/market/*`

As rotas tecnicas de Auth precisam permanecer publicas para concluir identidade. Elas nao expoem patrimonio.

## Rotas privadas

Todas as demais rotas exigem claims validas: Dashboard, Carteira, Operacoes, Proventos, Objetivos, Configuracoes, Conta, Conhecimento e modulos patrimoniais. O proxy preserva pathname e query em `next` e o login retorna exatamente ao destino seguro.

## Primeiro acesso

Depois de validar claims, o proxy consulta apenas a existencia de membership. Usuario sem carteira vai para `/onboarding`; usuario com carteira acessa a rota desejada. Erro na consulta nao e interpretado como ausencia de carteira. Login cria Profile pelo servico existente.

## Layouts

`AppShell` escolhe `PublicShell` nas rotas publicas e preserva a navegacao interna nas rotas privadas. A Landing e um Server Component; apenas o roteamento do shell e os links usam o runtime cliente ja existente.

## Seguranca

O proxy usa `getClaims()` para identidade. RLS continua sendo a autoridade dos dados. Redirecionamentos externos, caminhos com barra dupla e caminhos inseguros sao rejeitados por `getSafeRedirectPath`.
