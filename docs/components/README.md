# Component Documentation

This directory contains documentation for all reusable components in the Salaryman application.

## Core Components

### Forms

#### AccountFormClient
**Purpose**: Handles creation and editing of bank accounts
**Location**: `src/components/AccountFormClient.tsx`
**Props**:
```typescript
{
  action: (formData: FormData) => Promise<void>
  initialData?: {
    name: string
    type: string
    balance: number
  }
}
```

#### ExpenseFormClient
**Purpose**: Handles expense entry and editing
**Location**: `src/components/ExpenseFormClient.tsx`
**Props**:
```typescript
{
  cats: { id: number; name: string }[]  // Available categories
  cards: { id: number; name: string }[] // Available credit cards
  accounts: { id: number; name: string }[] // Available bank accounts
  emis?: { id: number; name: string }[] // Available EMIs
  action: (formData: FormData) => void
  defaults?: {
    amount?: string
    date?: string // yyyy-mm-dd
    paymentMethod?: string
    accountId?: number
    creditCardId?: number
    recurringId?: number
  }
}
```
**Features**:
- Multiple payment methods (cash, UPI, credit card)
- Category selection
- Recurring payment linking
- Real-time form validation
- Date picker with manual input support
- Account/Card selection based on payment method
- Optional EMI linking

#### IncomeFormClient
**Purpose**: Handles income entry and tracking
**Location**: `src/components/IncomeFormClient.tsx`
**Props**:
```typescript
{
  action: (formData: FormData) => void
  accounts?: { id: number; name: string }[] // Available bank accounts
  cards?: { id: number; name: string }[] // Available credit cards
}
```
**Features**:
- Income amount and source tracking
- Date selection with calendar
- Bank account selection
- Optional credit card refund handling
- Description field for notes
- Real-time validation
- Loading state handling

#### RecurringFormClient
**Purpose**: Manages recurring payment setup
**Location**: `src/components/RecurringFormClient.tsx`
**Props**:
```typescript
{
  action: (formData: FormData) => Promise<ActionResult | void>
  defaults?: {
    name?: string
    amount?: string | number
    totalAmount?: string | number
    dayOfMonth?: number
    monthOfYear?: string // 1-12 in DB, month name in UI
    dayOfWeek?: string  // 0-6 in DB, day name in UI
    customDate?: string
    active?: boolean
    categoryName?: string | null
    customCategoryName?: string
    frequency?: "yearly" | "monthly" | "weekly" | "custom"
    startDate?: string | null
    endDate?: string | null
  }
  accountOptions: Option[]
  creditCardOptions: Option[]
  initialTab?: "emi" | "subscription" | "utilitybill"
}
```
**Features**:
- Three payment types:
  - EMI: Loan payments with total amount tracking
  - Subscription: Regular service payments
  - Utility Bills: Monthly utilities
- Flexible frequency options:
  - Monthly with day selection
  - Weekly with day selection
  - Yearly with month and day
  - Custom date option
- Category management:
  - Predefined categories per type
  - Custom category support
  - Category validation
- Date handling:
  - Start/End dates for EMIs
  - Next due date calculations
  - Frequency-specific date inputs
- Status tracking:
  - Active/Inactive toggle
  - Payment progress for EMIs

### Report & Dashboard Components

#### Charts
**Location**: `src/components/reports/Charts.tsx`
**Features**:
- Income vs Expense visualization
- Category breakdown charts
- Monthly trends
- Responsive design
- Custom height configuration
- No external dependencies

#### DateRangePicker
**Location**: `src/components/reports/DateRangePicker.tsx`
**Purpose**: Custom date range selection for reports
**Features**:
- Flexible date range selection
- Preset ranges (This month, Last month, etc.)
- Calendar popup
- Range validation

#### MultiSelectFilter
**Location**: `src/components/reports/MultiSelectFilter.tsx`
**Purpose**: Multi-select filtering component
**Features**:
- Multiple item selection
- Search functionality
- Select all/none options
- Customizable options

#### ReportFilters
**Location**: `src/components/reports/ReportFilters.tsx`
**Purpose**: Combined filters for reports
**Features**:
- Date range selection
- Category filtering
- Account filtering
- Export options

#### ReportsClient
**Location**: `src/components/reports/ReportsClient.tsx`
**Purpose**: Main reports interface
**Features**:
- Filter management
- Data aggregation
- Chart configuration
- Download functionality

#### SummaryCards
**Location**: `src/components/reports/SummaryCards.tsx`
**Purpose**: Displays financial summary cards
**Features**:
- Total income/expense display
- Net value calculation
- Savings tracking
- Credit utilization monitoring
- Real-time updates
- Responsive layout

#### TransactionsTable
**Location**: `src/components/reports/TransactionsTable.tsx`
**Purpose**: Detailed transaction listing
**Features**:
- Sortable columns
- Pagination
- Category coloring
- Amount formatting
- Date formatting
- Transaction type icons

### Navigation & Layout Components

#### Navbar
**Location**: `src/components/Navbar.tsx`
**Features**:
- Responsive navigation menu
- User authentication state
- Quick action buttons
- Active route highlighting
- Mobile menu support
- User profile dropdown
- Theme toggle

#### Breadcrumbs
**Location**: `src/components/Breadcrumbs.tsx`
**Props**:
```typescript
{
  items: {
    label: string
    href?: string
  }[]
  className?: string
}
```
**Features**:
- Navigation hierarchy display
- Active/clickable links
- Custom styling support
- Responsive design
- Automatic truncation

#### CreditCardSelector
**Location**: `src/components/CreditCardSelector.tsx`
**Purpose**: Credit card selection and display
**Features**:
- Card list display
- Selection handling
- Card details preview
- Balance information
- Due date display

#### RecurringAlertsClient
**Location**: `src/components/RecurringAlertsClient.tsx`
**Purpose**: Upcoming payment notifications
**Features**:
- Due payment alerts
- Payment status tracking
- Priority-based sorting
- Action buttons
- Dismissible alerts

## UI Components

All UI components are built on top of shadcn/ui and can be found in `src/components/ui/`. These components form the foundation of our design system.

### Input Components

#### Button
**Usage**:
```tsx
<Button variant="default" size="sm">
  Click me
</Button>
```
**Variants**: default, outline, ghost, link
**Sizes**: sm, md, lg
**Features**:
- Loading state
- Disabled state
- Icon support
- Full width option

#### Input
**Usage**:
```tsx
<Input 
  type="text"
  placeholder="Enter value"
  className="h-12 text-base"
/>
```
**Types**: text, number, date, email, password
**Features**:
- Error state
- Disabled state
- Prefix/suffix
- Size variants

#### Select
**Components**:
- Select
- SelectTrigger
- SelectContent
- SelectItem
- SelectValue
**Features**:
- Single selection
- Custom triggers
- Searchable options
- Group support

### Layout Components

#### Card
**Components**:
- Card
- CardHeader
- CardTitle
- CardDescription
- CardContent
- CardFooter
**Usage**:
- Content containers
- Information display
- Form sections
- Summary blocks

#### Dialog
**Types**:
- AlertDialog: Confirmations
- Dialog: Modal content
- Sheet: Side panels
**Features**:
- Focus trapping
- Keyboard navigation
- Backdrop click
- Animation
- Custom positioning

#### Tabs
**Components**:
- Tabs
- TabsList
- TabsTrigger
- TabsContent
**Features**:
- Controlled/uncontrolled
- Custom styling
- Orientation options
- Animation support

### Data Display

#### Table
**Components**:
- Table
- TableHeader
- TableBody
- TableRow
- TableCell
**Features**:
- Sortable headers
- Row selection
- Custom cell rendering
- Sticky headers

#### Badge
**Variants**: default, secondary, outline
**Usage**: Status indicators, labels, counts

#### ScrollArea
**Features**:
- Custom scrollbars
- Smooth scrolling
- Responsive design
- Fixed height support

## Best Practices

1. Component Structure
   - Keep components focused and single-purpose
   - Use TypeScript interfaces for props
   - Include proper error handling
   - Implement loading states

2. State Management
   - Use React hooks appropriately
   - Implement proper form validation
   - Handle async operations safely

3. Styling
   - Use Tailwind CSS classes
   - Follow design system guidelines
   - Ensure responsive behavior
   - Maintain accessibility

4. Performance
   - Implement proper memoization
   - Optimize re-renders
   - Lazy load when appropriate
   - Use proper key props in lists
