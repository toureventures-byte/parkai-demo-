# ParkGrid — Demo Spec

> Read this file at the start of every build session before changing any code.

## What ParkGrid is
ParkGrid is a no-hardware, software-only reporting and monthly-parker platform for parking operators. Operators upload the exports their existing gate, valet or LPR systems already produce. ParkGrid's AI turns those exports into KPI dashboards, audits and reports, and manages monthly parkers.

- Tagline: **Intelligence for every parking asset.**
- Domain: GetParkGrid.com
- Audience for the demo: independent parking operators (15–50 locations), hotel/venue valet operators, property managers with garages.

## What the demo must do (nothing more)

### Moment 1: Upload anything → AI analysis
- Accepts CSV, Excel (.xlsx, multiple sheets) and PDF exports.
- AI maps unknown columns to ParkGrid fields (date/time in and out, amount, payment type, lane, attendant, ticket number, etc.) and shows the mapping for the user to confirm.
- Produces:
  - **KPI dashboard:** revenue, transactions, average ticket, occupancy (when available), comps, voids, validations; daily trend; breakdown by lane, attendant or payment type.
  - **Audit:** flagged problems with a one-line reason each. Must detect missing ticket numbers, cash variance, unusual comps by one person, revenue dips, lost-ticket spikes and validation spikes.
  - **Report:** one-click PDF with KPIs, audit findings and an AI summary at the top ("3 things to look at this week").
- From upload to dashboard in under 60 seconds.

### Moment 2: Log in → manage monthly parkers
- Simple demo login (one account; Supabase auth is fine).
- Roster: view, add and remove parkers (name, company, email, vehicle, plate, space type, rate, start, contract end, access card).
- Import roster + payment history from Excel.
- AI flags on the roster, each with a reason:
  - Late this month (unpaid more than 5 days past the 1st)
  - Repeat late payer (late 4+ of the last 6 months)
  - Past due 45+ days but card still active (highest priority)
  - Partial payment
  - Contract ending within 30 days
- Cancelled parkers with disabled cards are never flagged.

### Moment 3: Ask ParkGrid
- Chat box that answers plain-English questions using the uploaded data AND the parker roster.
- Answers are short, specific and include numbers and dates.
- Must pass the 5 scripted questions in `ParkGrid-Demo-Data-Pack/0_ANSWER-KEY.md`.

## Brand
Source of truth: getparkgrid.com.
- Logo: `public/parkgrid-logo.png` (full wordmark) and `public/parkgrid-mark.png` (P mark only). Never redraw them.
- Colors: background #061d16, panel #0b2a20, border #254238, mint accent #7cdda9, primary button #a7edc5 with dark green text #092419, muted text #a2b8ad, logo green #04934E.
- Fonts: Manrope for headings, DM Sans for body text.
- Hero line: "Run every parking asset from one intelligent platform."
- Clean, dense, operator-friendly. No stock photos, no emoji.

## Stack (keep it)
- React + Vite, Recharts, SheetJS; hosted on Vercel; code on GitHub.
- Supabase for login and saving the roster.
- An AI API for column mapping, audit summaries and Ask ParkGrid. API keys live in Vercel environment variables, never in the code.

## Rules
1. One feature per session. Don't touch unrelated code.
2. Every change must still pass the data-pack test: all 4 files load and every problem in the answer key is caught.
3. Demo data only. No real customer data, no employer data, no real payments.
4. Out of scope: Stripe/real payments, parker self-service portal, multi-tenant sign-up, admin panels, live voice AI.
5. If something breaks, roll back to the last working version before trying a fix.
6. Explain changes in plain language. The owner is not a developer.
