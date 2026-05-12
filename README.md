# Financial Planner

Financial Planner is a comprehensive Vue 3 application aimed at tracking, calculating, and simulating different financial scenarios, including investment goals, portfolio growth, and life-long timelines.
It features multiple interactive tabs allowing users to project their future wealth dynamically and accurately.

## Key Features

- **Time Gap:** Analyze and compare different chronological offset scenarios to understand the cost of delaying investments.
- **Past Simulator:** Simulate exactly how much you would have today if you started investing consistently in the past.
- **Goal Calculator:** Determine the exact monthly contributions needed to reach a specific financial goal within a target timeframe.
- **Portfolio Tracker:** Add, edit, and keep a clear view of your active investments, including total principal, yields, and growth rates.
- **Life Timeline:** A dynamic, row-based interactive timeline of your net worth projecting months/years into the future. Syncs across balances automatically.

## Security & Persistence

- **Zero-Trust Encryption:** All physical and persistent data is encrypted client-side using `AES-GCM` powered by the native `Web Crypto API`. The encryption key is derived locally using PBKDF2 from a user-supplied Master Password and is never written to disk, preventing any unauthorized reads.
- **Auto Storage & Mitigation:** Operations flow seamlessly through the encryption layer into browser databases (IndexedDB). Existing legacy plain-text data automatically migrates to ciphertext.
- **Encrypted Backups:** Safely export and import full vault backups (`.json`). The raw payload is fully encrypted, meaning you can store backups freely on any cloud.
- **Language & Currency Agnostic:** Switch seamlessly between English (en-US, USD) and Portuguese (pt-BR, BRL) via a unified options interface.

## Tech Stack

- Vue 3 + Vite
- Vitest for Unit Testing
- Vanilla CSS with a modern dark theme
- IndexedDB + LocalStorage for robust, reactive state storage

## Getting Started

First, ensure you have [Node.js](https://nodejs.org/) installed on your machine.

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server locally:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm run test
   ```

## Documentation

For a detailed breakdown of core utility functions and services used throughout the application, see the [Function Documentation](docs/Functions.md).
