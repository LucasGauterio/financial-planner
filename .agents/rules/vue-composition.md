# Rule: Vue 3 Composition API & Architecture

## Directives
1. **Component Syntax**: Use `<script setup>` syntax for all Vue 3 single-file components (`.vue`).
2. **Reactivity**: Prefer `ref()` for primitive values and `reactive()` for unified complex state objects.
3. **Decoupled Math Logic**: Vue components must focus strictly on UI rendering, user input handling, and reactive state binding.
   - All compound interest, timeline projections, and financial calculations MUST live in `src/services/financialCalculations.js` or dedicated service modules.
4. **Vanilla CSS Styling**:
   - Maintain the modern dark theme aesthetic defined in `src/style.css`.
   - Use CSS custom variables (`var(--bg-primary)`, `var(--accent-color)`, etc.).
   - Ensure interactive UI elements feature micro-animations and smooth hover transitions.
