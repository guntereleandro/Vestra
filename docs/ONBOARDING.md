# Onboarding inicial

## Quando aparece

Somente para usuario autenticado sem membership em carteira. Usuario com carteira que tenta abrir `/onboarding` retorna ao Dashboard.

## Campos

- nome da primeira carteira;
- moeda base;
- fuso horario.

Nao existe tutorial, tour ou configuracao financeira adicional.

## Conclusao

`completeRemoteOnboarding` garante o Profile e cria a carteira pela RPC atomica existente, que tambem cria o primeiro owner. Depois, o usuario retorna ao `next` original validado ou ao `/dashboard`.

## Falhas e repeticao

O formulario preserva os campos e exibe erro sem criar dados locais. A criacao atomica e a consulta previa de portfolios tornam a repeticao previsivel. Nenhuma operacao, cotacao ou dado do localStorage e enviado.
