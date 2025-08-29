import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { recurringPayments, transactions } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUserId } from "@/lib/auth";
import { computeNextRunDate, type RecurringPayment } from "@/lib/recurring";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ items: [] });
  const dbUserId = await getOrCreateUserId();

  const rows = await db
    .select({
      id: recurringPayments.id,
      name: recurringPayments.name,
      amount: recurringPayments.amount,
      dayOfMonth: recurringPayments.dayOfMonth,
      monthOfYear: recurringPayments.monthOfYear,
      dayOfWeek: recurringPayments.dayOfWeek,
      customDate: recurringPayments.customDate,
      frequency: recurringPayments.frequency,
      startDate: recurringPayments.startDate,
      endDate: recurringPayments.endDate,
      active: recurringPayments.active,
      paymentMethod: recurringPayments.paymentMethod,
      accountId: recurringPayments.accountId,
      creditCardId: recurringPayments.creditCardId,
    })
    .from(recurringPayments)
    .where(
      and(
        eq(recurringPayments.userId as any, dbUserId as any),
        eq(recurringPayments.active as any, true as any)
      )
    );

  const today = new Date();
  const fiveDays = 5 * 24 * 60 * 60 * 1000;

  // Fetch transactions for current month to decide "paid this period"
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const txRows = await db
    .select({
      recurringId: transactions.recurringId,
      count: sql`COUNT(*)`.mapWith(Number),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId as any, dbUserId as any),
        eq(transactions.type as any, "expense" as any),
        gte(transactions.date as any, monthStart as any),
        lte(transactions.date as any, monthEnd as any)
      )
    )
    .groupBy(transactions.recurringId);

  const paidThisMonth = new Set<number>();
  for (const t of txRows) if (t.recurringId != null) paidThisMonth.add(Number(t.recurringId));

  const items = (rows || [])
    .map((r) => {
      try {
        const nextDue = computeNextRunDate(r as RecurringPayment, today);
        return nextDue ? { ...r, nextDue } : null;
      } catch (error) {
        console.error("Error computing next run date:", error);
        return null;
      }
    })
    .filter(Boolean) as Array<any & { nextDue: Date }>;

  const upcoming = (items || []).filter((r) => {
    try {
      const diff = r?.nextDue?.getTime() - today.getTime();
      return diff >= 0 && diff <= fiveDays && !paidThisMonth.has(Number(r?.id));
    } catch (error) {
      console.error("Error filtering upcoming items:", error);
      return false;
    }
  });

  return NextResponse.json({
    items: upcoming.map((u) => ({
      id: u.id,
      name: u.name,
      amount: String(u.amount),
      nextDueDate: u.nextDue.toLocaleDateString("en-CA"),
      paymentMethod: u.paymentMethod,
      accountId: u.accountId,
      creditCardId: u.creditCardId,
    })),
  });
}
