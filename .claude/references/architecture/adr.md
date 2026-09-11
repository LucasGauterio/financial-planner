# Reference · ADR (Architecture Decision Record): Formato MADR Adaptável

Guia do formato MADR (Markdown Any Decision Records). Uma ADR registra **uma decisão arquitetural fechada ou reuso de padrão**, com contexto e consequências. Funciona para QUALQUER stack (SPAs Vue/React, NestJS, Go, Python, etc.).

---

## 🛑 Regra de Execução Obrigatória (No-Skip)

> **ADR é obrigatório em toda fase/feature.** Se nenhuma arquitetura nova for introduzida, a ADR de **Reuso de Padrões & Conformidade Arquitetural** DEVE ser gerada/atualizada, citando os ADRs anteriores e os arquivos reais do código com `#Lnn`.

---

## Quando algo vira ADR (regra dos 3 Es)

- **Estrutural**: Afeta como o sistema é construído ou integrado, cruza fronteiras de módulos ou componentes.
- **Evidente**: Qualquer desenvolvedor ou agente precisará entender o "porquê" no futuro.
- **Estável**: Expectativa de durar meses ou anos.

---

## Categorias Arquiteturais por Stack

1. **Persistência & Armazenamento**:
   - Backend: Banco SQL/Relacional, NoSQL, ORM, Migrations.
   - Frontend SPA: IndexedDB, LocalStorage, Criptografia de Vault (AES-GCM), State Store.
2. **Segurança, Autenticação & Criptografia**:
   - Backend: JWT Secret, OAuth2, RBAC, Headers de Segurança.
   - Frontend SPA: Web Crypto API (`window.crypto.subtle`), Derivação de Chaves PBKDF2, Sanitização contra XSS.
3. **Separação de Responsabilidades**:
   - Backend: Módulos DDD, Services, Controllers.
   - Frontend SPA: Desacoplamento entre UI Vue/React e serviços puros de cálculo em `src/services/`.
4. **Comunicação, Eventos & Async**:
   - Backend: REST, gRPC, Filas/Workers, Event-Driven Architecture.
   - Frontend SPA: Reactive i18n, Custom Composables (`useAuth`, `useStorage`), Web Workers.
5. **Resiliência & Tratamento de Erros**:
   - Backend: Retry com Backoff Exponencial, DLQ, Circuit Breaker.
   - Frontend SPA: Boundaries de Erro UI, Fallbacks Reativos, Validação de Formulários.
6. **Reuso de Padrões Existentes**:
   - Garantia de alinhamento com convenções globais e ADRs pré-existentes.

---

## Formato MADR (7 Seções)

```markdown
# ADR-NNN: [título específico da decisão ou reuso de padrão]

**Status:** Aceito
**Data:** AAAA-MM-DD
**Decisões relacionadas:** ADR-001, ADR-002

## Contexto e problema
[O problema, a motivação e as restrições arquiteturais. 2 a 3 parágrafos.]

## Decisão
[Qual caminho ou padrão existente foi adotado. Direto. 1 a 2 parágrafos.]

## Alternativas consideradas
- **[Alternativa 1]:** [descrição e trade-off do porquê foi descartada ou adaptada].

## Consequências
- Positivas: [ganhos de manutenibilidade, segurança ou performance]
- Negativas / limitações aceitas: [trade-offs aceitos]

## Referências
- [`src/services/exampleService.js`](../../src/services/exampleService.js#L15)
- [`docs/RFC.md`](../RFC.md)
- [`ADR-001`](ADR-001-storage-strategy.md)
```
