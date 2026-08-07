# Definition of Done do Vestra Core

Para iniciar os 30 dias, também é obrigatório: nenhuma rota futura exposta como funcional, recuperação para erros críticos, validação mobile/acessível, backup testado e ausência de bloqueador financeiro conhecido.

Status: critério oficial de conclusão para etapas do Vestra Core.

Uma etapa só pode ser declarada concluída quando todos os itens aplicáveis estiverem atendidos e houver evidência verificável. Item não aplicável deve ser registrado com justificativa; não deve ser simplesmente omitido.

## Checklist obrigatório

- [ ] Escopo e critérios de aceite da etapa foram atendidos.
- [ ] `npm run build` foi aprovado.
- [ ] `npm run lint` foi aprovado.
- [ ] Scripts de validação aplicáveis foram aprovados.
- [ ] Compatibilidade com dados e fluxos existentes foi preservada.
- [ ] Não foi identificada regressão funcional nos fluxos afetados.
- [ ] Documentação técnica e de produto foi atualizada.
- [ ] Nenhum segredo, token, credencial ou dado pessoal foi exposto em código, logs, documentação ou bundle cliente.
- [ ] Nenhuma duplicação relevante de regra, dado ou componente foi criada.
- [ ] A arquitetura e as ADRs vigentes foram respeitadas.
- [ ] O código está legível, coeso e com nomenclatura consistente.
- [ ] Erros esperados são tratados e mensagens expostas são seguras e compreensíveis.
- [ ] Tipos, formatos, unidades, datas, moedas e valores nulos são consistentes nas fronteiras alteradas.
- [ ] A Central de Conhecimento foi atualizada quando a interface ou uma funcionalidade de usuário foi criada ou alterada.
- [ ] O roadmap foi atualizado quando houve avanço, mudança de escopo, dependência ou ordem.
- [ ] Dependências novas estão justificadas e aprovadas; quando proibidas pela etapa, nenhuma foi adicionada.
- [ ] Migrações e caminhos de recuperação foram validados quando dados persistentes foram afetados.
- [ ] Limitações, riscos residuais e itens adiados foram registrados.
- [ ] O diff final contém somente alterações pertencentes ao escopo aprovado.

## Evidências esperadas

O encerramento da etapa deve registrar:

- arquivos criados e alterados;
- validações executadas e respectivos resultados;
- compatibilidade ou migração preservada;
- documentação atualizada;
- limitações e riscos restantes;
- confirmação de ausência de mudanças fora do escopo.

## Aplicação por tipo de mudança

### Documentação

Build e lint continuam obrigatórios quando exigidos pela etapa. Deve ser confirmado que nenhum arquivo funcional, dependência, dado ou configuração de execução foi alterado.

### Interface

Além do checklist obrigatório, validar estados de carregamento, vazio, erro, indisponibilidade e responsividade nos fluxos afetados.

### Engine financeira

Além do checklist obrigatório, executar fixtures ou validadores do domínio, cobrir casos-limite e confirmar que as funções permanecem puras e determinísticas.

### Persistência e repositórios

Além do checklist obrigatório, validar contratos, migrações, backup, isolamento por usuário e carteira quando aplicável, idempotência e tratamento de falhas parciais.

### Integrações externas

Além do checklist obrigatório, validar segredo no servidor, limites, timeout, cache, fallback, sanitização de erros e comportamento quando o fornecedor estiver indisponível.

## Condições que impedem conclusão

Uma etapa não está concluída quando:

- uma validação obrigatória falha;
- depende de correção manual não documentada para funcionar;
- altera comportamento ou dados fora do escopo;
- deixa regressão conhecida sem aceite explícito;
- introduz segredo ou dado sensível em local indevido;
- atualiza código sem atualizar a documentação aplicável;
- exige a etapa seguinte para tornar a entrega atual compilável ou utilizável.
