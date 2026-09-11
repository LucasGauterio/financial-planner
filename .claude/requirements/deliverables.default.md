# General Deliverables Criteria (deliverables.default.md)

Este perfil define os critérios de aceite padrão para a geração do pacote de documentação de um projeto.

---

## 1. Artefatos de Entrada & Configuração Básica

- [ ] **Contexto Inicial**: `CLAUDE.md` e `context.md` gerados na raiz do projeto.
- [ ] **Rastreabilidade de Fontes**: Todo requisito e decisão deve ser derivado do código-fonte existente e/ou especificações/transcrições de entrada fornecidas.
- [ ] **Prosa Limpa**: PRD, RFC, FDD e ADRs não devem conter timestamps ou marcações inline poluentes; a rastreabilidade linha a linha fica centralizada no `docs/TRACKER.md`.

---

## 2. Entregáveis Obrigatórios

### 2.1 PRD (`docs/PRD.md`)
- [ ] Visão geral do produto, contexto de negócio e justificativa.
- [ ] Personas de usuário primárias e secundárias.
- [ ] Escopo explícito: Itens no escopo vs. Itens fora de escopo / adiados.
- [ ] Requisitos Funcionais (FR) com IDs padronizados (`FR-001`, `FR-002`).
- [ ] Requisitos Não-Funcionais (NFR) cobrindo performance, segurança, resiliência e usabilidade.

### 2.2 RFC (`docs/RFC.md`)
- [ ] Contexto técnico e motivação da proposta de arquitetura.
- [ ] Proposta de design do sistema e componentes principais.
- [ ] Avaliação de soluções alternativas consideradas e justificativa da escolha.
- [ ] Estratégia de integração, compatibilidade e migração de dados.
- [ ] Impacto de segurança, autenticação e proteção de dados.

### 2.3 FDD (`docs/FDD.md`)
- [ ] Especificações detalhadas dos módulos e contratos de componentes.
- [ ] Definição de interfaces, endpoints de API e schemas de dados (payloads de request e response).
- [ ] Matriz de erros e tratamento de exceções.
- [ ] Seção final "Diagramas": 4 a 10 diagramas Mermaid/C4 embutidos (fluxogramas, sequências, diagramas de estado e componentes).

### 2.4 ADRs (`docs/adrs/ADR-NNN-*.md`)
- [ ] Diretório `docs/adrs/` contendo entre 3 e 8 arquivos formatados em kebab-case (`ADR-001-titulo.md`).
- [ ] Cada ADR contém: Status, Contexto, Decisão, Alternativas Consideradas (≥ 1) e Consequências (positivas e negativas com trade-off explícito).
- [ ] O conjunto cobre as decisões fundamentais do projeto (ex: armazenamento/banco de dados, comunicação/APIs, autenticação/segurança, estado e concorrência).

### 2.5 Tracker (`docs/TRACKER.md`)
- [ ] Matriz de rastreabilidade em formato de tabela (ID, Documento, Tipo, Conteúdo, Fonte, Localização).
- [ ] Links relativos apontando para arquivos reais do repositório com âncoras de linha (`file.ext#Lnn`).

---

## 3. Regras de Integridade & Qualidade

- [ ] **Somente Leitura do Código**: A geração de documentação NÃO altera o código-fonte da aplicação (`src/`, `lib/`, etc.).
- [ ] **Links Válidos**: Todas as referências a arquivos reais utilizam links relativos válidos com âncoras de linha.
- [ ] **Consistência de Escopo**: Requisitos descartados ou adiados são explicitamente documentados no escopo de fora do PRD e não viram requisitos de implementação.
