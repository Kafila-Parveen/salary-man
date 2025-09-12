# Salaryman — Product Requirements Document (PRD)

## 1. Product Overview
Salaryman is a comprehensive personal finance management application designed to help users track their income, expenses, and overall financial health with a modern, user-friendly interface.

## 2. Target Audience
- Individuals seeking to manage personal finances
- Professionals tracking multiple income sources and expenses
- Users who want to track recurring payments and subscriptions
- People looking to improve their financial habits through data insights

## 3. Core Features

### 3.1 Authentication & User Management
- Secure authentication using Clerk
- Protected routes and data privacy
- User profile management

### 3.2 Dashboard
- Financial overview with key metrics
  - Total income and expenses
  - Net value calculation
  - Savings tracking
- Visual analytics
  - Income vs. Expenses bar charts
  - Category-wise expense breakdown
  - Monthly trends
- Recent transactions list
- Quick access to add income/expense

### 3.3 Account Management
- Multiple account support
  - Bank accounts (savings, current)
  - Credit cards
  - Loans
- Balance tracking
- Account-wise transaction history
- Credit card utilization monitoring

### 3.4 Transaction Management
- Income recording
  - Multiple income sources
  - Date and category tracking
- Expense tracking
  - Category-based organization
  - Payment method tracking (UPI, credit card)
  - Description and notes
- Transaction categorization
- Historical transaction view

### 3.5 Recurring Payments
- Support for multiple payment types:
  - EMIs
  - Subscriptions
  - Utility bills
- Frequency options:
  - Monthly
  - Weekly
  - Yearly
  - Custom dates
- Payment tracking and status
- Due date notifications
- Balance computation for EMIs

### 3.6 Category Management
- Custom category creation
- Category-wise expense analysis
- Transaction categorization

## 4. Technical Architecture

### 4.1 Frontend
- Framework: Next.js 13+ with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- State Management: Server Components + React Hooks

### 4.2 Backend
- Database: PostgreSQL
- ORM: Drizzle
- API: Next.js API Routes
- Authentication: Clerk

### 4.3 Deployment
- Platform: Vercel
- Database Hosting: Managed PostgreSQL

## 5. User Flows

### 5.1 Core Flows
1. User Registration and Onboarding
   - Sign up with email/password
   - Account setup
   - Initial preferences

2. Daily Usage
   - Dashboard overview
   - Transaction recording
   - Balance checking
   - Expense tracking

3. Recurring Payment Management
   - Setup new recurring payments
   - Track payment status
   - Manage existing payments
   - View payment history

4. Financial Review
   - Monthly overview
   - Category analysis
   - Spending patterns
   - Savings tracking

## 6. Future Enhancements
1. Mobile Application
2. Budget Planning and Tracking
3. Investment Portfolio Integration
4. Multi-currency Support
5. AI-powered Transaction Categorization
6. Bill Payment Integration
7. Financial Goals Setting
8. Export/Import Functionality

## 7. Success Metrics
- User Engagement
  - Daily active users
  - Transaction frequency
  - Feature usage statistics
- Performance
  - Page load times
  - API response times
  - Error rates
- User Satisfaction
  - Feature adoption rate
  - User feedback
  - Retention rate
