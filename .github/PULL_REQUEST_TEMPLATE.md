# Pull Request Description

## 📝 Change Overview
Briefly describe the purpose of this PR and what changes have been introduced.

---

## 🎯 Associated Task / Issue
- Closes # (issue / feature)
- Requirement Anchor: `docs/PRD.md#FR-xxx` / `docs/TRACKER.md`

---

## 🏷 Commit Type (Conventional Commits)
Select all that apply:
- [ ] `feat:` A new feature for the user
- [ ] `fix:` A bug fix
- [ ] `docs:` Documentation changes only
- [ ] `refactor:` Code refactoring without changing functionality
- [ ] `test:` Adding or updating unit/integration tests
- [ ] `chore:` Build process, dependency update, or tooling changes

---

## 🧪 Verification & Testing Completed
- [ ] Ran `npx vitest run` — all tests pass (0 regressions).
- [ ] Ran `npx vitest run --coverage` — verified coverage thresholds.
- [ ] Ran `.claude/commands/design-docs-validate` / doc validation scripts.

---

## 🔒 Security & Data Protection Checklist
- [ ] Zero raw secrets or keys committed to source.
- [ ] Input strings sanitized; no unsanitized `v-html` used.
- [ ] Persistent storage payloads encrypted via AES-GCM Web Crypto API.
