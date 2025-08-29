# Salaryman — Product Requirements Document (PRD)

## 1. Overview
Salary Manager is a personal finance management application designed to help users track their income, expenses, savings, and recurring payments. The application provides a comprehensive view of one's financial health through various dashboards and reporting features.

## 2. Objectives
- Simplify personal finance management
- Provide clear visibility into spending patterns
- Help users track and manage recurring payments
- Enable better financial planning and budgeting
- Support multiple account types and payment methods

## 3. Features

### 3.1 Core Features
- **User Authentication**
  - Secure login/signup using Clerk
  - User profile management

- **Account Management**
  - Multiple account support (savings, current, loans)
  - Credit card management
  - Account balance tracking

- **Transaction Management**
  - Income and expense tracking
  - Categorization of transactions
  - Recurring payment management
  - Transaction history and filtering

- **Dashboard**
  - Financial overview
  - Spending analytics
  - Upcoming payments

### 3.2 Technical Stack
- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Deployment**: Vercel

## 4. User Flows
1. **Onboarding**
   - User signs up
   - Sets up initial accounts
   - Configures basic preferences

2. **Daily Usage**
   - Logs in to the dashboard
   - Records transactions
   - Reviews financial status
   - Manages upcoming payments

3. **Periodic Review**
   - Analyzes spending patterns
   - Reviews and updates recurring payments
   - Adjusts budget as needed

## 5. Future Enhancements
- Mobile application
- Budget tracking and alerts
- Investment portfolio tracking
- Bill payment integration
- Multi-currency support
- Automated transaction categorization
- Financial goal setting and tracking

## 6. Success Metrics
- Landing bounce rate and time-to-first-interaction.
- Auth conversion rate from landing CTA.
- Dashboard load time (TTI under ~2s on mid devices).

## 7. Scope (MVP)
- Landing page using shadcn components: `Button`, `Card`, `Badge`.
- Hero section that fits above the fold on common laptop sizes.
- Two analytics cards with mock data: mini bar chart and donut.
- Clerk auth integrated, preserving existing flows.
- Tailwind-based responsive styling.

## 8. UX/UI Requirements
- Use shadcn/ui styling and components consistently.
- Keep hero compact (no vertical scroll on common viewports).
- Analytics cards visually balanced, equal heights.
- Accessible colors and semantic HTML where possible.

## 9. Technical Requirements
- Next.js App Router (existing).
- Clerk for auth (existing).
- shadcn/ui components (`button`, `card`, `badge`) in `src/components/ui/`.
- Tailwind CSS.
- No heavy chart libs; use lightweight inline primitives.

## 10. Architecture Notes
- Keep charts as simple TSX components for now (`MiniBarChart`, `DonutApprox`).
- Co-locate landing page at `src/app/page.tsx`. Dashboard at `src/app/dashboard/page.tsx`.

## 11. Milestones
- M1: Landing page refactor to shadcn components (DONE).
- M2: Visual parity for analytics cards (DONE).
- M3: Documentation (PRD, requirements, status) (THIS PR).
- M4: Optional richer charts (shadcn/Recharts) with lazy loading.
- M5: Replace mock data with real data sources.

## 12. Risks & Mitigations
- Visual drift on small screens → maintain min-heights, responsive type scales.
- Chart complexity creep → keep primitives; evaluate trade-offs before adding libs.
- Auth route changes → ensure Clerk middleware and routes remain intact.

## 13. Open Questions
- Do we plan bank integrations (Plaid, SaltEdge) soon?
- Pricing and plan tiers for public launch?
- Do we need a marketing navigation (docs, blog, pricing) now or later?

---

## v2 Addendum — Auth, Accounts, Cards, Real Data

### Overview
We extended the MVP into a functional personal finance app with authenticated flows, accounts and credit cards management, validated forms, and dashboard fed by real DB queries.

### Goals (v2)
- Secure routes with Clerk middleware; keep home and auth routes public.
- Add Accounts and Credit Cards management (list/add/edit/delete) with robust validation.
- Record income/expenses linked to accounts and optional credit cards.
- Replace dashboard mock sections with real data for balances and summaries.
- Implement Recurring Payments (EMI/subscription/utility) with scheduling and tracking.

### Key Features Delivered
- Authentication & Middleware
  - Public: `/` and Clerk routes; all others protected.
  - Server helpers in `src/lib/auth.ts` to map Clerk user to DB user.
- Accounts
  - Add/list/edit/delete accounts with required 16‑digit `account_number` (stored as varchar(16), masked as `•••• •••• •••• 1234`).
  - Client validation with inline errors; server normalization to digits.
  - “Saving…” submit state for better UX.
- Credit Cards
  - CRUD UI with inline validations and delete confirmations.
- Transactions
  - Income and Expense forms; expense shows credit card select when applicable.
  - Expense form supports optional linking to an EMI (recurring payment) to reduce its pending balance.
  - Date input UX: dual text (dd/mm/yyyy) and native date picker kept in sync.
- Recurring Payments
  - List/detail/edit for recurring items with types: `emi`, `subscription`, `utility`.
  - EMI: supports `totalAmount`, computes Paid and Pending from linked expense transactions.
  - Subscription/Utility: category label stored via `tabCategoryLabel`; monthly cadence with custom day or derived from provided date.
  - Next due date calculation for monthly/weekly/yearly with clamping for month length.
  - Delete with confirmation; quick actions on list cards; deep links preserve selected tab via `?tab=`.
- Dashboard
  - Shows real balances and quick navigation buttons (mobile friendly).
- UI Consistency
  - Standardized page padding per preference: add `pl-4 pr-4` to top-level containers.

### Non‑Goals
- Bank integrations, advanced analytics, budgeting, multi‑currency.

### Next
- Categories Management UI (CRUD).
- Recurring Payments: export/reporting of EMI schedules (optional).
- DB CHECK constraints for digits‑only patterns and optional unique keys per user.
