# Princípios de Engenharia do Vestra Core

Status: princípios permanentes para decisões, implementação e revisão.

Quando houver conflito entre conveniência imediata e estes princípios, a decisão deve privilegiar a confiabilidade de longo prazo do produto. Exceções exigem justificativa técnica documentada.

## 1. Simplicidade antes de complexidade

Escolher a solução mais simples que cumpra os requisitos reais, preserve a arquitetura e permita evolução. Abstrações devem resolver uma necessidade concreta.

## 2. Evolução incremental

Evoluir a base existente em passos verificáveis. Migrações precedem remoções e cada mudança deve reduzir, não ocultar, o risco da próxima.

## 3. Pequenas entregas

Manter escopo limitado, critérios de aceite claros e diff revisável. Cada etapa deve compilar, funcionar e poder ser validada isoladamente.

## 4. Compatibilidade primeiro

Preservar dados, contratos e fluxos existentes. Mudanças incompatíveis exigem migração explícita, estratégia de recuperação e documentação.

## 5. Engine independente da UI

Regras financeiras pertencem à engine pura. A engine não conhece React, DOM, storage, rede ou providers; a interface não recria cálculos financeiros.

## 6. Componentes pequenos e coesos

Componentes devem ter responsabilidade clara e tamanho compatível com sua função. Coordenação complexa deve ser separada de apresentação sem fragmentação artificial.

## 7. Reutilização antes de duplicação

Reutilizar regras, normalizadores, componentes e contratos existentes quando atendem ao caso. Duplicação de regra financeira ou de fonte de dados não é aceitável.

## 8. Documentação faz parte do produto

Arquitetura, decisões, operação e experiência do usuário devem permanecer compreensíveis. Uma mudança não está completa sem atualizar a fonte oficial aplicável.

## 9. Testes acompanham a arquitetura

Validadores e testes devem proteger contratos e limites entre camadas, não apenas detalhes de implementação. Engines puras usam fixtures; repositories usam testes de contrato; fluxos críticos recebem validação proporcional ao risco.

## 10. Nenhuma feature sem necessidade real

Priorizar necessidades comprovadas do uso diário e a missão do Core. Ideias experimentais e funcionalidades fora do roadmap não justificam complexidade antecipada.

## 11. Preferir composição

Combinar unidades pequenas por contratos explícitos. Evitar heranças, objetos universais e abstrações que concentrem responsabilidades sem necessidade.

## 12. Separação clara entre domínio e infraestrutura

O domínio expressa regras do produto. Banco, APIs, cache, storage e framework são detalhes de infraestrutura e não devem definir as regras centrais.

## 13. Persistência desacoplada

Consumidores acessam dados por serviços e contratos de repositório. Adapters podem mudar sem exigir reescrita da UI ou da engine.

## 14. Operações como fonte da verdade

Posições, resultados e proventos derivam de operações. Dados derivados podem acelerar leitura, mas nunca competir silenciosamente com a fonte primária.

## 15. Falhas explícitas e seguras

Erros esperados devem ter tratamento previsível. Não esconder falhas com fallback de escrita, não expor detalhes sensíveis e não converter ausência de dado em valor financeiro válido.

## 16. Segurança por fronteira

Segredos permanecem no servidor. Dados de usuário são isolados por identidade e carteira. Toda nova fronteira de entrada valida formato, autorização e escopo.

## 17. Consistência de dados

Contratos devem explicitar formatos, unidades, datas, moedas, nulabilidade e IDs. Normalização ocorre nas fronteiras e cálculos não devem depender de coerções implícitas.

## 18. Observabilidade sem exposição

Falhas importantes precisam ser diagnosticáveis, mas logs não podem conter tokens, segredos ou dados financeiros desnecessários. Mensagens ao usuário devem ser claras e sanitizadas.

## 19. Dependências com propósito

Adicionar biblioteca somente quando o benefício superar custo, risco e manutenção. Preferir capacidades da plataforma e dependências já adotadas quando suficientes.

## 20. Qualidade contínua

Lint, build e validadores aplicáveis fazem parte de cada entrega. Dívida descoberta deve ser classificada e registrada; não deve ser misturada ao escopo sem necessidade.

