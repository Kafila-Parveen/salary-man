import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { transactions, accounts, creditCards } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import IncomeFormClient from "@/components/IncomeFormClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrCreateUserId } from "@/lib/auth";

export default async function IncomeNewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/income");
  const dbUserId = await getOrCreateUserId();
  if (!dbUserId) {
    redirect("/sign-in?error=user_not_found");
  }

  // Load accounts and cards for select
  const acctRows = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(eq(accounts.userId as any, dbUserId as any));
  const cardRows = await db
    .select({ id: creditCards.id, name: creditCards.name })
    .from(creditCards)
    .where(eq(creditCards.userId as any, dbUserId as any));

  async function createIncome(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/income");

    const dbUserId = await getOrCreateUserId();
    if (!dbUserId) {
      redirect("/sign-in?error=user_not_found");
    }
    const amountStr = String(formData.get("amount") || "").trim();
    const source = String(formData.get("source") || "").trim();
    const dateStr = String(formData.get("date") || "").trim();
    const description = String(formData.get("description") || "").trim() || null;
    const accountIdStr = String(formData.get("accountId") || "").trim();
    const applyToCard = String(formData.get("applyToCard") || "") === "on";
    const creditCardIdStr = String(formData.get("creditCardId") || "").trim();

    if (!amountStr || !source || !dateStr || (!applyToCard && !accountIdStr)) {
      // In a full implementation, return field errors via redirect or re-render state.
      redirect("/income?error=missing_fields");
    }

    // Drizzle numeric wants string
    const amount = amountStr; // drizzle numeric accepts string
    const accountId = accountIdStr ? Number(accountIdStr) : undefined;
    const creditCardId = creditCardIdStr ? Number(creditCardIdStr) : undefined;

    await db.insert(transactions).values({
      userId: dbUserId.toString(),
      type: "income",
      amount,
      source,
      accountId: !applyToCard ? accountId : undefined,
      creditCardId: applyToCard ? creditCardId : undefined,
      date: dateStr,
      description: description || undefined,
    });

    // If applying to card (refund/adjustment), reduce card balance and increase available. Else, deposit to account
    if (applyToCard && creditCardId) {
      await db.execute(sql`
        UPDATE credit_cards
        SET
          current_balance = GREATEST(0, COALESCE(current_balance, 0) - ${amount}),
          available_credit = GREATEST(0, credit_limit - GREATEST(0, COALESCE(current_balance, 0) - ${amount}))
        WHERE id = ${creditCardId} AND user_id = ${dbUserId}
      `);
    } else if (accountId) {
      // increment account balance
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amount}` as any })
        .where(eq(accounts.id as any, accountId as any));
    }

    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <div className="mb-4 max-w-xl mx-auto flex items-center justify-start">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
      </div>
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Record Income</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeFormClient action={createIncome} accounts={acctRows} cards={cardRows} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
