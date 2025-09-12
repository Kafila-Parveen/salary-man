# Salaryman - Requirements Document

## 1. Functional Requirements

### 1.1 User Authentication
- Secure user registration and login using Clerk
- Protected routes for authenticated users
- User profile management
- Session management
- Password reset functionality

### 1.2 Dashboard
- Display financial overview
  - Total income
  - Total expenses
  - Net value
  - Savings
- Visual representation of data
  - Income vs Expense charts
  - Category-wise expense breakdown
  - Monthly trends
- Quick access to common actions
  - Add income
  - Add expense
  - View recurring payments
- Recent transactions list
- Account balances summary

### 1.3 Account Management
- Support for multiple account types
  - Savings accounts
  - Current accounts
  - Credit cards
  - Loans
- Account operations
  - Add new accounts
  - Edit account details
  - View account balance
  - Track transactions
- Credit card specific features
  - Credit limit tracking
  - Available balance monitoring
  - Statement period tracking
  - Payment due dates

### 1.4 Transaction Management
- Income recording
  - Amount
  - Date
  - Category
  - Description
  - Account selection
- Expense recording
  - Amount
  - Date
  - Category
  - Payment method (UPI, credit card)
  - Description
  - Link to recurring payments
- Transaction history
  - Filtering options
  - Sorting capabilities
  - Search functionality

### 1.5 Category Management
- Default categories for income and expenses
- Custom category creation
- Category editing and deletion
- Category-wise transaction grouping
- Category-based analytics

### 1.6 Recurring Payments
- Support multiple payment types
  - EMIs
  - Subscriptions
  - Utility bills
- Payment configuration
  - Amount
  - Frequency (weekly, monthly, yearly, custom)
  - Start date
  - End date (optional)
  - Category
- Payment tracking
  - Due date calculation
  - Payment status
  - Payment history
- EMI specific features
  - Total amount tracking
  - Paid amount calculation
  - Remaining balance
- Notifications for upcoming payments

### 1.7 Reports and Analytics
- Transaction reports
  - Date range selection
  - Category filtering
  - Account filtering
- Expense analytics
  - Category-wise breakdown
  - Monthly trends
  - Payment method analysis
- Income analytics
  - Source-wise breakdown
  - Monthly trends
- Export functionality

## 2. Non-Functional Requirements

### 2.1 Performance
- Page load time < 2 seconds
- API response time < 500ms
- Smooth scrolling and transitions
- Efficient data loading and pagination

### 2.2 Security
- Secure authentication
- Data encryption
- CSRF protection
- Input validation
- XSS prevention

### 2.3 Reliability
- 99.9% uptime
- Data backup
- Error handling
- Recovery procedures

### 2.4 Scalability
- Support for growing user base
- Efficient database queries
- Optimized API endpoints
- Resource optimization

### 2.5 Usability
- Responsive design
- Mobile-friendly interface
- Intuitive navigation
- Clear error messages
- Loading states
- Form validation

### 2.6 Maintainability
- Clean code architecture
- Documentation
- Version control
- Testing coverage
- Monitoring and logging

## 3. Technical Requirements

### 3.1 Frontend
- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React hooks for state management

### 3.2 Backend
- PostgreSQL database
- Drizzle ORM
- RESTful APIs
- Authentication with Clerk

### 3.3 Deployment
- Vercel hosting
- Managed PostgreSQL database
- Environment configuration
- CI/CD pipeline

### 3.4 Development
- Version control with Git
- Code review process
- Testing framework
- Development, staging, and production environments
- Monitoring and error tracking
