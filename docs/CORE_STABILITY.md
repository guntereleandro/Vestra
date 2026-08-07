# Estabilidade do Vestra Core

## Jornadas críticas

O checklist permanente cobre Landing, Auth, onboarding, carteiras, fonte Local/Supabase, CRUD de compras/vendas/proventos, cotações, Dashboard, carteira, ativo, histórico, troca de contexto, logout/login, senha e backup/restauração.

## Recuperação

- falha remota: mensagem explícita e ação para usar Local;
- sessão expirada: entrar novamente preservando retorno seguro;
- carteira ausente: onboarding ou seleção de carteira;
- operação inválida: manter modal aberto e corrigir os campos;
- ativo ausente: voltar para Carteira;
- conflito de importação: não sobrescrever e apresentar divergências;
- backup inválido: rejeitar sem alterar dados;
- link de senha inválido: solicitar novo link.

Erros nunca devem ser convertidos em carteira vazia.

## Mobile e acessibilidade

Validar 320, 360, 390, 430, tablet e desktop. Critérios: sem overflow horizontal intencional, navegação e bottom bar acessíveis, modais roláveis, alvos com altura adequada, labels, foco visível, Escape, ordem de tabulação, headings e mensagens com texto além de cor.

## Observabilidade mínima

O diagnóstico usa códigos sanitizados de Auth, fonte, repository, mercado e schema. Não registrar tokens, credenciais, cookies, service role, operações completas ou carteira do usuário. Serviços externos não fazem parte desta etapa.

## Pendências classificadas

- bloqueador do Core: nenhuma divergência financeira conhecida;
- bloqueador de Production: vulnerabilidades transitivas altas em PostCSS/Sharp e validação completa de Auth/recuperação no domínio final;
- não bloqueador: warnings `MODULE_TYPELESS_PACKAGE_JSON`, certificados específicos do ambiente Windows e pgTAP dependente do Docker Desktop.

## Dependências

Na auditoria de 2026-08-07, Next.js 16.2.12 traz PostCSS até 8.5.22 e Sharp abaixo de 0.35.0. O npm sugere Next.js 16.3.0 via atualização forçada. A atualização fica separada do Core até regressão dedicada; `npm audit fix --force` é proibido.

## CORE-12.1 — validação pré-30 dias (2026-08-07)

Foram percorridas Landing, login, Dashboard, Carteira, Operações, Proventos, detalhe de ativo, Mercado, Configurações, Conta, onboarding, troca de carteira, troca Local/Supabase, CRUD remoto, provento, histórico, logout e novo login. Não houve erro de console. A fonte remota persistiu após recarga e novo login, sem mistura com a coleção Local.

Viewports verificados: 320, 360, 390, 430 e 768 px. Dashboard, Carteira, Operações, Proventos, Conta e Configurações não apresentaram overflow horizontal. Modal de operação permaneceu contido em 320 px, com labels e fechamento por Escape. O botão de criação de carteira recebeu altura mínima de toque.

Correções aplicadas: ciclo de sessão removida entre login/onboarding; detalhe de ativo compatível com parâmetros assíncronos; atualização imediata dos painéis após troca de carteira; estado neutro durante resolução da fonte; Browser Client Supabase singleton; limpeza completa dos fixtures.

Evidência manual registrada em 2026-08-07 pelo responsável do projeto: o e-mail real de recuperação foi recebido, o link foi aberto, uma nova senha foi definida e o login com essa senha foi concluído com sucesso. Essa evidência completa o fluxo que os testes remotos já haviam validado para geração de token, troca de senha e rejeição de reutilização.

Pendências restantes: pgTAP não executou por ausência do Docker Desktop; a varredura completa de foco por Tab/Shift+Tab permanece como endurecimento para Production.

Classificação final: nenhum item A; varredura completa de foco por Tab/Shift+Tab = B; pgTAP sem Docker = C; warnings `MODULE_TYPELESS_PACKAGE_JSON` = C. Os itens B/C não bloqueiam o teste pessoal no ambiente Development.
