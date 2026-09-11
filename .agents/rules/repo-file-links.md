# Rule: Repository File Links & Line Anchors (repo-file-links)

## Directives
1. **Relative File Links**: Every reference to a file in the repository must be formatted as a relative Markdown link.
2. **Line Anchors for Cites**: When citing specific symbols, methods, or logic blocks in an existing file, append line anchors: `[src/services/financialCalculations.js](../src/services/financialCalculations.js#L20-L45)`.
3. **New Code Specs**: For files/modules to be created in the future, format as inline code spans (e.g. `src/services/newService.js`), not broken links.
