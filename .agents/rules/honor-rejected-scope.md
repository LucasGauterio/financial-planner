# Rule: Respect Out-of-Scope and Deferred Items (honor-rejected-scope)

Identifying what is **out of scope** or **deferred** is just as important as defining active requirements.

## Directives
1. **No Out-of-Scope Feature Leakage**: Any feature, architectural choice, or enhancement explicitly discarded or deferred during project planning MUST NOT appear as an active functional requirement or component contract.
2. **Explicit Placement**:
   - **PRD**: Record discarded or deferred items under the `"Out of Scope / Deferred Items"` section.
   - **RFC**: Record items pending future evaluation under `"Open Questions / Future Roadmap"`.
3. **Validation Filter**: If an out-of-scope or deferred item appears as an active requirement in a PRD or FDD, remove or correct it.
