import { db } from "@/db/drizzle";
import { users, categories, accounts, transactions, creditCards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getReportData(
  clerkUserId: string,
  startDate?: string,
  endDate?: string,
  accountIds?: string[],
  creditCardIds?: string[],
  categoryIds?: string[],
  type?: string[] 
) {
  // 1️⃣ Resolve internal user
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerk_id, clerkUserId))
    .then((res) => res[0]);

  if (!user) throw new Error("User not found");

  // 2️⃣ Combined Account + Credit filter
  let filterCondition = sql``;

  if (accountIds?.length && !accountIds.includes("all") &&
      creditCardIds?.length && !creditCardIds.includes("all")) {
    // both selected → OR condition
    filterCondition = sql`
      AND (
        t."account_id" IN (${sql.join(accountIds, sql`, `)})
        OR t."credit_card_id" IN (${sql.join(creditCardIds, sql`, `)})
      )
    `;
  } else if (accountIds?.length && !accountIds.includes("all")) {
    filterCondition = sql`AND t."account_id" IN (${sql.join(accountIds, sql`, `)})`;
  } else if (creditCardIds?.length && !creditCardIds.includes("all")) {
    filterCondition = sql`AND t."credit_card_id" IN (${sql.join(creditCardIds, sql`, `)})`;
  }

  // 🔹 Category filter
  if (categoryIds?.length && !categoryIds.includes("all")) {
    filterCondition = sql`${filterCondition} AND t."category_id" IN (${sql.join(categoryIds, sql`, `)})`;
  }

  // 🔹 Type filter
  if (type?.length) {
    filterCondition = sql`${filterCondition} AND t."type" IN (${sql.join(type, sql`, `)})`;
  }


  // 3️⃣ Summary for current range
  const summaryResult = await db.execute(sql`
    SELECT 
      COALESCE(SUM(CASE WHEN t."type" = 'income' THEN t."amount" ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN t."type" = 'expense' THEN t."amount" ELSE 0 END), 0) AS expense,
      COALESCE(SUM(CASE WHEN t."type" = 'expense' AND t."credit_card_id" IS NULL THEN t."amount" ELSE 0 END), 0) AS expenseForSavings
    FROM "transactions" t
    WHERE t."user_id" = ${user.id}
      ${startDate && endDate ? sql`AND t."date" BETWEEN ${startDate} AND ${endDate}` : sql``}
      ${filterCondition}
  `);

  // 4️⃣ Totals till date
  const overallResult = await db.execute(sql`
    SELECT 
      COALESCE(SUM(CASE WHEN t."type" = 'income' THEN t."amount" ELSE 0 END), 0) AS totalIncome,
      COALESCE(SUM(CASE WHEN t."type" = 'expense' THEN t."amount" ELSE 0 END), 0) AS totalExpense,
      COALESCE(SUM(CASE WHEN t."type" = 'expense' AND t."credit_card_id" IS NULL THEN t."amount" ELSE 0 END), 0) AS totalExpenseForSavings
    FROM "transactions" t
    WHERE t."user_id" = ${user.id}
      ${filterCondition}
  `);

  // 5️⃣ Transactions list (JOIN for readable category + account)
  const transactionsResult = await db.execute(sql`
    SELECT 
      t.id,
      t.date,
      t.type,
      COALESCE(c.name, 'Uncategorized') AS category,
      t.amount,
      COALESCE(a.name, cc.name, 'Unknown') AS account,
      t.description
    FROM "transactions" t
    LEFT JOIN "categories" c ON t.category_id = c.id
    LEFT JOIN "accounts" a ON t.account_id = a.id
    LEFT JOIN "credit_cards" cc ON t.credit_card_id = cc.id
    WHERE t."user_id" = ${user.id}
      ${startDate && endDate ? sql`AND t."date" BETWEEN ${startDate} AND ${endDate}` : sql``}
      ${filterCondition}
    ORDER BY t."date" DESC, t."id" DESC
  `);

  // ✅ Categories
  const categoriesResult = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories);
   
  // ✅ Accounts
  const accountsResult = await db
    .select({
      id: accounts.id,
      name: accounts.name,
    })
    .from(accounts);

  // ✅ Credit cards
  const creditCardsResult = await db
    .select({
      id: creditCards.id,
      name: creditCards.name,
    })
    .from(creditCards)
    .where(eq(creditCards.userId, user.id));

  // Extract values safely
  const f = summaryResult.rows?.[0] ?? { income: "0", expense: "0", expenseforsavings: "0" };
  const o = overallResult.rows?.[0] ?? { totalincome: "0", totalexpense: "0", totalexpenseforsavings: "0" };

  const income = Number(f.income) || 0;
  const expense = Number(f.expense) || 0;
  const savings = income - (Number(f.expenseforsavings) || 0);

  const totalIncome = Number(o.totalincome) || 0;
  const totalExpense = Number(o.totalexpense) || 0;
  const totalSavings = totalIncome - (Number(o.totalexpenseforsavings) || 0);

  return {
    summary: { income, expense, savings, totalIncome, totalExpense, totalSavings },
    transactions: transactionsResult.rows ?? [],
    categories: categoriesResult ?? [],
    accounts: accountsResult ?? [],
    creditCards: creditCardsResult ?? [],
  };
}
