import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { transactions, categories, creditCards, accounts, recurringPayments } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpenseFormClient from "@/components/ExpenseFormClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrCreateUserId } from "@/lib/auth";

async function loadFormData(dbUserId: number | string | null) {
  const [cats, cards, emis, accts] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.userId as any, dbUserId as any)),
    db
      .select({ id: creditCards.id, name: creditCards.name })
      .from(creditCards)
      .where(eq(creditCards.userId as any, dbUserId as any)),
    db
      .select({ id: recurringPayments.id, name: recurringPayments.name })
      .from(recurringPayments)
      .where(and(eq(recurringPayments.userId as any, dbUserId as any), eq(recurringPayments.active, true))),
    db
      .select({ id: accounts.id, name: accounts.name })
      .from(accounts)
      .where(eq(accounts.userId as any, dbUserId as any)),
  ]);
  return { cats, cards, emis, accounts: accts };
}

export default async function ExpenseNewPage({
  searchParams: rawSearchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Ensure searchParams is an object
  const searchParams = rawSearchParams || {};
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/expense");

  const dbUserId = await getOrCreateUserId();
  if (!dbUserId) {
    redirect("/sign-in?error=user_not_found");
  }
  const { cats, cards, emis, accounts: accts } = await loadFormData(dbUserId);

  // Prefill values from popup deep-link
  const prefill = {
    amount: typeof searchParams.amount === "string" ? searchParams.amount : "",
    date: typeof searchParams.date === "string" ? searchParams.date : "",
    paymentMethod: typeof searchParams.paymentMethod === "string" ? searchParams.paymentMethod : "",
    accountId: typeof searchParams.accountId === "string" ? Number(searchParams.accountId) : undefined,
    creditCardId: typeof searchParams.creditCardId === "string" ? Number(searchParams.creditCardId) : undefined,
    recurringId: typeof searchParams.recurringId === "string" ? Number(searchParams.recurringId) : undefined,
  } as const;

  async function createExpense(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/expense");

    const dbUserId = await getOrCreateUserId();
    if (!dbUserId) {
      redirect("/sign-in?error=user_not_found");
    }
    const amountStr = String(formData.get("amount") || "").trim();
    const categoryIdStr = String(formData.get("categoryId") || "").trim();
    const paymentMethod = String(formData.get("paymentMethod") || "").trim();
    const creditCardIdStr = String(formData.get("creditCardId") || "").trim();
    const applyToCard = String(formData.get("applyToCard") || "") === "on";
    const accountIdStr = String(formData.get("accountId") || "").trim();
    const dateStr = String(formData.get("date") || "").trim();
    const description = String(formData.get("description") || "").trim() || null;
    const recurringIdStr = String(formData.get("recurringId") || "").trim();

    if (!amountStr || !categoryIdStr || !paymentMethod || !dateStr) {
      redirect("/expense?error=missing_fields");
    }

    const categoryId = Number(categoryIdStr);
    const creditCardId = creditCardIdStr ? Number(creditCardIdStr) : null;
    const accountId = accountIdStr ? Number(accountIdStr) : null;

    await db.insert(transactions).values({
      userId: dbUserId.toString(),
      type: "expense",
      amount: amountStr,
      categoryId: categoryId || undefined,
      paymentMethod: paymentMethod as any,
      creditCardId: paymentMethod === "credit_card" ? creditCardId : (paymentMethod === "upi" && applyToCard ? creditCardId : undefined),
      accountId: paymentMethod === "upi" ? accountId : undefined,
      date: dateStr,
      description: description || undefined,
      recurringId: recurringIdStr ? Number(recurringIdStr) : undefined,
    });

    // Update account balance for UPI payments
    if (paymentMethod === "upi" && accountId) {
      await db.execute(sql`UPDATE accounts SET balance = COALESCE(balance, 0) - ${amountStr} WHERE id = ${accountId} AND user_id = ${dbUserId}`);
    }

    // Update credit card balances for credit card payments
    if (paymentMethod === "credit_card" && creditCardId) {
      await db.execute(sql`
        UPDATE credit_cards
        SET
          available_limit = GREATEST(0, available_limit - ${amountStr}::numeric)
        WHERE id = ${creditCardId} AND user_id = ${dbUserId}
      `);
    }

    // Paying credit card bill via UPI: reduce card balance and increase available
    if (paymentMethod === "upi" && applyToCard && creditCardId) {
      await db.execute(sql`
        UPDATE credit_cards
        SET
          available_limit = LEAST(credit_limit, available_limit + ${amountStr}::numeric)
        WHERE id = ${creditCardId} AND user_id = ${dbUserId}
      `);
    }

    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <div className="mb-4 max-w-2xl mx-auto flex items-center justify-start">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
      </div>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseFormClient
              cats={cats}
              cards={cards}
              accounts={accts}
              emis={emis}
              action={createExpense}
              defaults={prefill}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// async function createExpense(formData: FormData) {
//   "use server";
//   const { userId } = await auth();
//   if (!userId) redirect("/sign-in?redirect_url=/expense");

//   const dbUserId = await getOrCreateUserId();
//   if (!dbUserId) {
//     redirect("/sign-in?error=user_not_found");
//   }

//   const amountStr = String(formData.get("amount") || "").trim();
//   const categoryIdStr = String(formData.get("categoryId") || "").trim();
//   const paymentMethod = String(formData.get("paymentMethod") || "").trim();
//   const creditCardIdStr = String(formData.get("creditCardId") || "").trim();
//   const applyToCard = String(formData.get("applyToCard") || "") === "on";
//   const accountIdStr = String(formData.get("accountId") || "").trim();
//   const dateStr = String(formData.get("date") || "").trim();
//   const description = String(formData.get("description") || "").trim() || null;
//   const recurringIdStr = String(formData.get("recurringId") || "").trim();

//   if (!amountStr || !categoryIdStr || !paymentMethod || !dateStr) {
//     redirect("/expense?error=missing_fields");
//   }

//   const categoryId = Number(categoryIdStr);
//   const creditCardId = creditCardIdStr ? Number(creditCardIdStr) : null;
//   const accountId = accountIdStr ? Number(accountIdStr) : null;

//   // Insert new expense
//   await db.insert(transactions).values({
//     userId: dbUserId.toString(),
//     type: "expense",
//     amount: amountStr,
//     categoryId: categoryId || undefined,
//     paymentMethod: paymentMethod as any,
//     creditCardId:
//       paymentMethod === "credit_card"
//         ? creditCardId
//         : paymentMethod === "upi" && applyToCard
//         ? creditCardId
//         : undefined,
//     accountId: paymentMethod === "upi" ? accountId : undefined,
//     date: dateStr,
//     description: description || undefined,
//     recurringId: recurringIdStr ? Number(recurringIdStr) : undefined,
//   });

//   // Update account balance for UPI payments
//   if (paymentMethod === "upi" && accountId) {
//     await db.execute(sql`
//       UPDATE accounts
//       SET balance = COALESCE(balance, 0) - ${amountStr}
//       WHERE id = ${accountId} AND user_id = ${dbUserId};
//     `);
//   }

//   // Update credit card balances for credit card payments
//   if (paymentMethod === "credit_card" && creditCardId) {
//     await db.execute(sql`
//       UPDATE credit_cards
//       SET available_limit = GREATEST(0, available_limit - ${amountStr}::numeric)
//       WHERE id = ${creditCardId} AND user_id = ${dbUserId};
//     `);
//   }

//   // Paying credit card bill via UPI: reduce card balance and increase available
//   if (paymentMethod === "upi" && applyToCard && creditCardId) {
//     await db.execute(sql`
//       UPDATE credit_cards
//       SET available_limit = LEAST(credit_limit, available_limit + ${amountStr}::numeric)
//       WHERE id = ${creditCardId} AND user_id = ${dbUserId};
//     `);
//   }

//   // ✅ Only update recurring next due date if linked
//   if (recurringIdStr) {
//     const recurringId = Number(recurringIdStr);

//     await db.execute(sql`
//       UPDATE recurring_payments
//       SET next_due_date = CASE
//         WHEN frequency = 'daily' THEN (DATE ${dateStr} + INTERVAL '1 day')
//         WHEN frequency = 'weekly' THEN (DATE ${dateStr} + INTERVAL '1 week')
//         WHEN frequency = 'monthly' THEN (DATE ${dateStr} + INTERVAL '1 month')
//         WHEN frequency = 'yearly' THEN (DATE ${dateStr} + INTERVAL '1 year')
//         ELSE next_due_date
//       END
//       WHERE id = ${recurringId} AND user_id = ${dbUserId};
//     `);
//   }

//   redirect("/dashboard");
// }
