# Rule: Source Code Read-Only Mode (source-code-is-read-only)

## Directives
1. **Zero Code Mutations**: During the documentation reverse-engineering pipeline (`design-docs`), all operations on application source files (`src/`, `lib/`, `configs/`, `prisma/`, tests) MUST be strictly READ-ONLY.
2. **Output Location**: All reverse-engineered documentation artifacts MUST be written to `context.md`, `CLAUDE.md`, or the `docs/` directory.
