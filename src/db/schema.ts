import { pgTable, pgSchema, varchar, integer, timestamp, boolean, numeric, text, date, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense", "savings"]);
export const accountTypeEnum = pgEnum("account_type", ["savings", "current", "loan_personal", "loan_car", "loan_bike", "loan_gold", "loan_home", "cash"]);
export const paymentMethodEnum = pgEnum("payment_method", ["upi", "cash", "credit_card", "debit_card", "net_banking", "cheque"]);
export const savingsTypeEnum = pgEnum("savings_type", ["fixed_deposit", "recurring_deposit", "mutual_funds", "stocks", "bonds", "chit_funds", "ppf", "other"]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", ["weekly", "monthly", "yearly", "custom"]);

export const tabTypeEnum = pgEnum("tab_type", ["emi", "subscription", "utilitybill"]);

// Users
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  clerk_id: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


// Accounts
export const accounts = pgTable("accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  accountNumber: varchar("account_number", { length: 20 }),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  isLoan: boolean("is_loan").default(false),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit Cards
export const creditCards = pgTable("credit_cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  cardNumber: varchar("card_number", { length: 20 }).notNull(),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }).notNull(),
  availableLimit: numeric("available_limit", { precision: 12, scale: 2 }).notNull(),
  statementDate: integer("statement_date").notNull(),
  dueDate: integer("due_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});


// Categories
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  icon: varchar("icon", { length: 50 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  source: varchar("source", { length: 100 }), 
  description: text("description"),
  date: date("date").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  paymentMethod: paymentMethodEnum("payment_method"),
  accountId: integer("account_id").references(() => accounts.id),
  creditCardId: integer("credit_card_id").references(() => creditCards.id),
  isRecurring: boolean("is_recurring").default(false),
  recurringId: integer("recurring_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recurring Payments
export const recurringPayments = pgTable("recurring_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  accountId: integer("account_id").references(() => accounts.id),
  creditCardId: integer("credit_card_id").references(() => creditCards.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  nextDueDate: date("next_due_date").notNull(),
  dayOfMonth: integer("day_of_month"),
  monthOfYear: varchar("month_of_year", { length: 20 }),
  dayOfWeek: varchar("day_of_week", { length: 20 }),
  customDate: date("custom_date"),
  active: boolean("active").default(true),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  tabType: tabTypeEnum("tab_type"),
  tabCategoryLabel: varchar("tab_category_label", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Savings/Investments
export const savings = pgTable("savings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  type: savingsTypeEnum("type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});