# Protocolo oficial de validação dos 30 dias

## Objetivo

Usar somente o Vestra para administrar investimentos durante 30 dias consecutivos, sem recorrer ao Investidor10 para funções essenciais.

## Preparação

- escolher a carteira e a fonte operacional que serão usadas;
- exportar um backup Local antes do primeiro dia;
- confirmar login, recuperação de senha e acesso em outro dispositivo;
- registrar a data inicial, dispositivo e navegador;
- manter dados reais somente na conta pessoal, nunca em fixtures.

## Registro diário

Copie a linha abaixo para cada dia:

| Dia/data | Dashboard | Operações | Proventos | Cotações | Carteira | Histórico | Erros | Usou concorrente? | Motivo | Tempo para resolver | Observações UX |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 / AAAA-MM-DD | | | | | | | | Não | | | |

Use `OK`, `N/A` ou uma descrição curta. Para cada erro, registre rota, fonte ativa, ação anterior, mensagem apresentada e se havia recuperação possível. Não registre senha, token, payload financeiro completo ou informação sensível.

## Falha funcional

É falha quando for necessário usar o Investidor10 para conhecer posição atual, registrar uma operação, calcular preço médio, consultar uma cotação necessária, acompanhar proventos, entender o patrimônio ou consultar histórico essencial.

Consulta por curiosidade ou comparação não conta como falha, desde que o Vestra tenha fornecido a função essencial corretamente.

## Tratamento de incidentes

Classifique cada ocorrência:

- bloqueadora: impede acompanhar ou alterar a carteira com segurança;
- alta: existe contorno no Vestra, mas compromete o uso diário;
- média: atrito relevante sem resultado incorreto;
- baixa: acabamento ou preferência.

Registre tempo até recuperação e evidência sanitizada. Falhas bloqueadoras pausam a contagem; após a correção e regressão, reinicie o período de 30 dias.

## Aprovação

O Core é aprovado após 30 dias consecutivos sem falha funcional, sem divergência financeira e sem uso essencial do concorrente. Itens médios/baixos podem seguir no backlog se não afetarem segurança, integridade ou rotina essencial.

## Gate pré-30 dias — 2026-08-07

Decisão: **APROVADO para iniciar a contagem**.

O gate funcional, remoto, responsivo, de dependências, lint e build passou. Em 2026-08-07, o responsável do projeto confirmou manualmente o recebimento do e-mail real de recuperação, abertura do link, definição de nova senha e login bem-sucedido. A evidência manual completa o teste remoto artificial, que já havia comprovado geração do token, troca de senha e rejeição de reutilização.

| Classe | Pendência | Decisão |
|---|---|---|
| A | nenhuma pendência | não há bloqueador para o início |
| B | varredura manual completa de foco por Tab/Shift+Tab em todos os modais | bloqueia Production, não os cálculos |
| C | pgTAP indisponível sem Docker Desktop | RLS e matriz SDK remota já passaram |
| C | warnings de módulos ESM sem `type: module` | sem regressão funcional |

O Dia 1 pode ser registrado a partir desta aprovação. Os itens B/C permanecem no backlog e não interrompem a contagem, salvo se produzirem falha funcional durante o uso diário.
