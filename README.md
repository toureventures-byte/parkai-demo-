# ParkGrid Web (`parkgrid-web`)

Frontend web application for **ParkGrid**, built with React 19, TypeScript, Vite, and Tailwind CSS. It ingests parking operations exports (CSV, XLSX/XLSM, PDF), runs automated anomaly and revenue-leakage audits, manages monthly parker rosters, and provides unified AI summaries and operational chat backed by `parkgrid-backend`.

## Key Features

- **Multi-format Export Ingestion**: Parses CSV/TSV/TXT (`papaparse`), `.xlsx`/`.xlsm` spreadsheets (`read-excel-file/universal`), and PDF activity reports (`pdfjs-dist`) directly in the browser.
- **Automated Audit & Insights**: Computes property KPIs, daily charts (`recharts`), revenue/comp/variance findings, and downloadable PDF reports (`jspdf`).
- **Monthly Parkers**: Tracks active rosters, billing balances, overdue accounts, and payment history.
- **Unified AI Assistant & Summaries**: Connects to `parkgrid-backend` (`/api/v1/facilities/:id/summary` and `/api/v1/facilities/:id/chat`) using JWT authentication with automatic token refresh, and falls back to deterministic local audit summaries and Q&A (`autoSummary`, `offlineAnswer`) when no backend session is active.

## Prerequisites

- Node.js 20+ and npm
- Optional: a running `parkgrid-backend` (Django Ninja) instance on `http://localhost:8000` for live authentication, persistent facility data, and backend AI features

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file from the template:

   ```bash
   cp .env.example .env
   ```

   Update `.env` if needed:
   - `VITE_API_BASE_URL`: Backend base URL (defaults to `http://localhost:8000`).
   - `VITE_GOOGLE_CLIENT_ID`: Google OAuth2 Client ID for Google Identity Services.

3. Start the development server:

   ```bash
   npm run dev
   ```

   By default, the Vite dev server (`vite.config.ts`) proxies `/api/v1` requests to `http://localhost:8000`. Demo and offline mode remain fully usable without a backend session using client-side parsing, deterministic audit rules, and local fallback answers.

## Available Scripts

Scripts defined in `package.json`:

- `npm run dev` - Start the Vite development server (`vite`)
- `npm run build` - Type-check and build production assets (`tsc -b && vite build`)
- `npm run lint` - Run `oxlint` across the codebase
- `npm run preview` - Preview the production build locally (`vite preview`)

Sample data verification scripts (via `tsx`):

- `npx tsx scripts/check-detect.ts public/sample` - Verify file type and column detection on the sample pack
- `npx tsx scripts/check-analyze.ts public/sample` - Verify KPI computation and audit findings on the sample pack

## Security & Architecture Notes

- **Backend-Unified AI (`api/ai.js` removed)**: The legacy Vercel serverless proxy (`api/ai.js`) and client-side prompt context builder (`buildFacts`) have been removed. All live AI summary and chat requests go through the authenticated Django Ninja backend (`parkgrid-backend`), with deterministic local fallbacks when offline.
- **Hardened Spreadsheet Parsing (`xlsx` removed)**: The `xlsx` (`0.18.5`) dependency has been removed to eliminate prototype pollution and ReDoS risks. Modern `.xlsx` and `.xlsm` files are parsed with `read-excel-file/universal`. Legacy binary `.xls`, `.xlsb`, and `.ods` uploads are intentionally disabled in the browser; convert them to `.xlsx` or `.csv` before uploading.
