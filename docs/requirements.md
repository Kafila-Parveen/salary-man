# Salary Manager - Requirements Document

## 1. Functional Requirements

### 1.1 User Authentication
- Users can sign up with email/password or social login
- Users can sign in and maintain a secure session
- Password reset functionality
- Profile management

### 1.2 Account Management
- Create and manage multiple bank accounts
- Support for different account types:
  - Savings
  - Current
  - Various loan types (personal, car, bike, gold, home)
  - Cash accounts
- Track account balances
- View transaction history per account

### 1.3 Credit Card Management
- Add and manage credit cards
- Track credit limits and available balance
- View statement dates and due dates
- Monitor spending per card

### 1.4 Transaction Management
- Record income and expenses
- Categorize transactions
- Add notes and attachments
- Filter and search transactions
- Bulk import/export functionality
- Recurring transaction support

### 1.5 Categories
- Create and manage custom categories
- Set category budgets (future)
- View spending by category
- Category-wise reports

### 1.6 Recurring Payments
- Set up recurring payments (EMIs, subscriptions, utility bills)
- Configure payment frequencies (weekly, monthly, yearly, custom)
- Track payment history
- Receive payment reminders

### 1.7 Dashboard
- Financial overview (net worth, cash flow)
- Spending analytics
- Upcoming payments
- Recent transactions
- Visual charts and reports

## 2. Non-Functional Requirements

### 2.1 Performance
- Page load time < 2 seconds
- Support for 1000+ transactions
- Efficient database queries

### 2.2 Security
- Secure authentication with Clerk
- Data encryption at rest and in transit
- Role-based access control
- Regular security audits

### 2.3 Usability
- Responsive design for all screen sizes
- Intuitive navigation
- Keyboard shortcuts
- Dark/light mode support

### 2.4 Compatibility
- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design

## 3. Technical Requirements

### 3.1 Frontend
- Next.js 13+ with TypeScript
- React 18+
- Tailwind CSS for styling
- shadcn/ui component library
- React Query for data fetching
- Form handling with React Hook Form
- Data validation with Zod

### 3.2 Backend
- Next.js API routes
- Server Components for better performance
- Rate limiting and API security

### 3.3 Database
- PostgreSQL
- Drizzle ORM for type-safe database access
- Database migrations
- Regular backups

### 3.4 Authentication
- Clerk for authentication
- Session management
- Social login providers

## 4. Data Model

### 4.1 Core Entities
- Users
- Accounts
- Credit Cards
- Transactions
- Categories
- Recurring Payments

### 4.2 Relationships
- User has many Accounts
- User has many Credit Cards
- Account has many Transactions
- Transaction belongs to a Category
- Recurring Payment can be linked to multiple Transactions

## 5. API Endpoints

### 5.1 Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `POST /api/auth/reset-password` - Password reset

### 5.2 Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### 5.3 Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### 5.4 Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### 5.5 Recurring Payments
- `GET /api/recurring` - List recurring payments
- `POST /api/recurring` - Create recurring payment
- `GET /api/recurring/:id` - Get recurring payment details
- `PUT /api/recurring/:id` - Update recurring payment
- `DELETE /api/recurring/:id` - Delete recurring payment

## 6. Development Workflow

### 6.1 Version Control
- Git for version control
- GitHub for code hosting
- Feature branch workflow
- Pull requests for code review

### 6.2 Testing
- Unit tests with Jest
- Integration tests with React Testing Library
- End-to-end tests with Cypress
- Test coverage reporting

### 6.3 Deployment
- Vercel for hosting
- Automatic deployments on push to main
- Preview deployments for pull requests
- Environment variables management

## 7. Future Enhancements

### 7.1 Short-term
- Budget tracking
- Financial goals
- Receipt scanning
- Multi-currency support

### 7.2 Long-term
- Mobile applications (iOS/Android)
- Investment portfolio tracking
- Tax reporting
- AI-powered insights and recommendations
- Integration with banks and financial institutions
