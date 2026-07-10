# Objetivos Patrimoniais

Versao: 0.5.0

## Estrutura

Os objetivos ficam no dominio local `lib/data/goals.js`.

Chaves:

- `vestra:goals:v1`
- `vestra:goalMilestones:v1`

Cada objetivo possui:

- `id`
- `title`
- `type`
- `targetValue`
- `description`
- `dueDate`
- `manualCurrent`
- `createdAt`
- `updatedAt`

## Tipos

- Patrimonio
- Renda Passiva
- Compra
- Viagem
- Veiculo
- Educacao
- Personalizado

Cada tipo define nome, icone, cor, meta e descricao.

## Persistencia

Os dados sao salvos apenas no `localStorage` do navegador.

O modulo nao usa banco de dados, autenticacao, API externa ou IA.

Os objetivos nao alteram o schema de backup existente.

## Atualizacao automatica

Objetivos de Patrimonio usam o patrimonio atual calculado pelo Vestra.

Objetivos de Renda Passiva usam o total de proventos registrados.

Esses valores sao derivados dos dados existentes e nao alteram a engine financeira.

## Objetivos manuais

Compra, Viagem, Veiculo, Educacao e Personalizado usam progresso manual.

O usuario informa o valor atual ao criar ou editar o objetivo.

## Marcos

O Vestra registra marcos locais para:

- Primeiro objetivo
- 10%
- 25%
- 50%
- 75%
- 100%
- Objetivo concluido

Esses marcos aparecem na Timeline do Dashboard.
