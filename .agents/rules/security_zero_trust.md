# Rule: Security, Zero-Trust & Gitleaks Compliance (security_zero_trust)

## Directives
1. **Secret & Key Protection**:
   - NEVER hardcode private keys, tokens, or passwords in source code, documentation, or unit tests.
   - Use environment variables (`.env`) and `.gitignore` sensitive files.

2. **Gitleaks Compliance for Sample Keys**:
   - When writing code snippets, mock data, or documentation examples, NEVER use high-entropy random strings, realistic API key prefixes (`pk_live_...`, `sk_live_...`, `AKIA...`, `ghp_...`), or realistic JWT hashes.
   - ALWAYS use safe, low-entropy placeholders (e.g. `<YOUR_API_KEY>`, `your_secret_key_placeholder`, `REPLACE_WITH_YOUR_KEY`).

3. **Input Sanitization & XSS Prevention**:
   - Sanitize all user inputs before processing or binding to DOM templates.
   - Never use unsanitized `v-html` or `dangerouslySetInnerHTML`.

4. **Data Storage Encryption**:
   - Encrypt persistent sensitive payload data before saving to browser storage or client database.
