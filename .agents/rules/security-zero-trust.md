# Rule: Zero-Trust Security & Client-Side Encryption

## Directives
1. **Web Crypto API Encryption**:
   - Physical storage in `IndexedDB` / `LocalStorage` MUST be encrypted client-side using `AES-GCM` with keys derived via `PBKDF2`.
   - Never store plain text financial balances, portfolio data, or personal targets in browser storage without passing through the encryption layer (`useStorage.js`).
2. **XSS Prevention**:
   - NEVER use Vue's `v-html` directive to output user-supplied data or calculated strings.
   - Sanitize any string operations before binding.
3. **Master Password Handling**:
   - The master password key must reside strictly in volatile memory (`ref`/`reactive` inside `useAuth.js`) and must NEVER be serialized or written to persistent disk/storage.
