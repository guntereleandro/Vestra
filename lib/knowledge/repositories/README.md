# Knowledge Repository

O contrato em `knowledgeRepository.js` isola consumidores da origem do conteúdo. Um provider deve implementar todos os métodos declarados, devolver artigos no schema editorial vigente e nunca expor registros inválidos.

## Provider remoto futuro

Crie um adaptador com o mesmo contrato, normalize respostas externas antes de devolvê-las e selecione-o apenas por configuração. Componentes React, rotas e pesquisa continuam consumindo `knowledgeService.js`.

O provider remoto deve versionar artigos por `version` e `revision`, validar IDs e rotas antes da publicação e respeitar `status` e `visibility`. Cache deve ser temporário, invalidado por revisão e nunca substituir silenciosamente conteúdo válido mais recente.

Falhas de rede, schema ou validação devem acionar o fallback local. A versão 0.8.2 não executa chamadas externas e mantém o catálogo atual como fonte oficial.

Um painel administrativo futuro deverá publicar revisões completas, manter IDs estáveis e alterar o status para `published` somente depois da validação. Conteúdo `draft`, `archived`, `private` ou `internal` não aparece na experiência pública.
