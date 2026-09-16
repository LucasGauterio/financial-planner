---
libs:
  "xlsx":
    version: "0.20.3"
    context7_id: "/websites/sheetjs"
    fetched_at: "2026-09-16T12:33:00"
sources_mtime:
  docs/decisions/technical-decisions-spreadsheet-export.md: "2026-09-16T12:32:30"
---

### xlsx (SheetJS Community Edition)

**Install — NOT the plain npm registry package.** SheetJS's own docs no longer recommend `npm i xlsx` (registry package is not the current release channel); the official install command pulls the tarball straight from their CDN:

```bash
npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

This resolves to `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` in `package.json`'s `dependencies` — a URL dependency, not a semver range. Verified against the official Vue/Vite quickstart (`docs.sheetjs.com/docs/demos/frontend/vue`) and the general install page (`docs.sheetjs.com/docs`), both of which use this exact command as of this fetch.

**Core API used by this phase (TD-01/TD-02 — one workbook, one tab per domain):**

```javascript
import * as XLSX from 'xlsx';

// one call per domain — converts an array of flat row objects into a worksheet
const ws = XLSX.utils.json_to_sheet(rows);

// assemble the workbook once, append each domain's sheet
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsIncome, 'Income');
XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans');
XLSX.utils.book_append_sheet(wb, wsPortfolio, 'Portfolio');
XLSX.utils.book_append_sheet(wb, wsCashFlow, 'Cash Flow');
XLSX.utils.book_append_sheet(wb, wsTimeline, 'Investment Timeline');

// serializes AND triggers the browser download in one call — no Blob/anchor wiring needed
XLSX.writeFile(wb, `financial_planner_export_${date}.xlsx`);
```

- `XLSX.utils.json_to_sheet(rows, opts?)` walks an array of plain objects and generates a worksheet with a header row derived from object keys (by default). `opts.header` can pin column order explicitly if key-derived order isn't stable enough for a given domain's row shape.
- `XLSX.utils.book_append_sheet(wb, ws, name)` — `name` becomes the visible tab name in Excel/Sheets; Excel restricts sheet names to 31 characters and disallows `: \ / ? * [ ]` — none of this phase's six planned tab names (`Income`, `Expenses`, `Loans`, `Portfolio`, `Cash Flow`, `Investment Timeline`) hit either limit.
- `XLSX.writeFile(wb, filename)` handles both serialization and the browser download trigger — this replaces the manual `Blob` + `URL.createObjectURL` + anchor-click pattern `BackupManager.vue` uses for its JSON export; no equivalent manual wiring is needed for the `.xlsx` path.
