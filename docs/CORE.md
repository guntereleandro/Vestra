# Vestra Core

Status: fonte oficial de escopo a partir da CORE-00. O nome “Vestra” é interno e não representa decisão final de marca.

## Missão

Transformar o protótipo atual em um produto sólido, confiável e adequado ao acompanhamento diário de investimentos. O Core deve permitir administrar a carteira sem recorrer ao Investidor10 para funções essenciais.

## Critério de conclusão

O Core será considerado concluído após 30 dias consecutivos de uso real em que o produto:

- registre e preserve operações com segurança;
- consolide posições, custos, preço médio, resultado e proventos corretamente;
- mantenha dados sincronizados entre sessões e dispositivos autorizados;
- ofereça cotações e estados de indisponibilidade compreensíveis;
- apresente dashboard e histórico patrimonial suficientes para a rotina;
- permita corrigir, excluir, exportar e auditar dados sem perda silenciosa;
- não exija o Investidor10 para nenhuma função essencial.

Qualquer retorno ao serviço de referência durante a validação deve ser registrado com motivo, impacto e funcionalidade ausente.

## Escopo incluído

1. Infraestrutura e configuração de ambientes.
2. Configuração central de marca.
3. Camada de persistência com contratos independentes do mecanismo de armazenamento.
4. Supabase com PostgreSQL, Auth e Row Level Security.
5. Perfis, carteiras, membros e permissões.
6. Operações como fonte de verdade.
7. Carteira consolidada e cotações.
8. Proventos.
9. Snapshots patrimoniais e dashboard.
10. Migração assistida dos dados locais.
11. Estabilidade, validação, observabilidade mínima e experiência de uso diário.
12. Preparação conceitual para planos e assinaturas futuras, sem cobrança no Core.

## Explicitamente adiado

- IA e recomendações;
- análise fundamentalista;
- Asset Score e Buy Score;
- notícias;
- gamificação;
- simulações;
- Imposto de Renda;
- funcionalidades experimentais.

Diagnósticos, comportamento, perfil, estratégia, objetivos, performance avançada e Central de Conhecimento existentes devem ser preservados durante a transição, mas não comandam a sequência do Core. Expansões nesses domínios ficam adiadas.

## Princípios de entrega

- Preservar o que funciona e evitar reescritas gerais.
- Fazer entregas pequenas, compatíveis e reversíveis.
- Manter operações como fonte de verdade dos cálculos da carteira.
- Separar cálculo puro, persistência, integração externa e interface.
- Atualizar a documentação na mesma etapa da mudança.
- Exigir lint e build aprovados em toda etapa.
- Não avançar para a etapa seguinte sem aceite da etapa corrente.

## Fontes oficiais

- `CORE.md`: missão e limites do Core.
- `ARCHITECTURE_DECISIONS.md`: decisões arquitetônicas permanentes e alternativas consideradas.
- `ENGINEERING_PRINCIPLES.md`: princípios obrigatórios de engenharia e manutenção.
- `DEFINITION_OF_DONE.md`: critérios e evidências para concluir cada etapa.
- `CURRENT_ARCHITECTURE.md`: estado real do sistema.
- `AUDIT.md`: diagnóstico e dívidas.
- `LOCAL_STORAGE_INVENTORY.md`: dados locais e migração.
- `CORE_ROADMAP.md`: ordem das entregas.
- `DATABASE_PLAN.md`: modelo conceitual e segurança.
- `BRANDING_CONFIG.md`: preparação para troca de marca.
- `SUPABASE_INFRASTRUCTURE.md`: clientes, ambiente, providers e fronteiras de segurança.
- `AUTHENTICATION.md`: fluxos de acesso, sessão, callback e configuração do Auth.
- `SECURITY_AUDIT.md`: advisories, alcance e decisões sobre dependências.
