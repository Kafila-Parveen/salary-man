import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db/drizzle";
import { recurringPayments, transactions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getOrCreateUserId } from "@/lib/auth";

// ---------- utils ----------
function fmt(amount: number | string | null) {
  const v = Number(amount || 0);
  return `₹${v.toFixed(2)}`;
}
function formatDate(d: Date | string | null) {
  return d ? String(d).slice(0, 10) : "-";
}

// ---------- page ----------
export default async function RecurringDetailsPage({
  params,
}: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/recurring");

  const dbUserId = await getOrCreateUserId();

  const idNum = Number(params.id);
  if (!idNum || Number.isNaN(idNum)) return notFound();

  // Fetch recurring payment
  const row = await db
    .select({
      id: recurringPayments.id,
      name: recurringPayments.name,
      amount: recurringPayments.amount,
      totalAmount: recurringPayments.totalAmount,
      frequency: recurringPayments.frequency,
      startDate: recurringPayments.startDate,
      endDate: recurringPayments.endDate,
      active: recurringPayments.active,
      tabType: recurringPayments.tabType,
      dayOfMonth: recurringPayments.dayOfMonth,
      dayOfWeek: recurringPayments.dayOfWeek,
      monthOfYear: recurringPayments.monthOfYear,
      customDate: recurringPayments.customDate,
      tabCategoryLabel: recurringPayments.tabCategoryLabel,
      nextDueDate: recurringPayments.nextDueDate,
    })
    .from(recurringPayments)
    .where(
      and(
        eq(recurringPayments.userId as any, dbUserId as any),
        eq(recurringPayments.id, idNum)
      )
    )
    .then((rows) => rows[0]);

  if (!row) return notFound();

  // Ensure row is an object before proceeding
  if (typeof row !== 'object' || row === null) {
    console.error('Invalid row data:', row);
    return <div>Error: Invalid payment data</div>;
  }

  // Safe destructuring with defaults
  const {
    amount = 0,
    totalAmount = 0,
    tabType = '',
    tabCategoryLabel = '',
    nextDueDate = null,
    startDate = null,
    endDate = null,
    dayOfMonth = null,
    dayOfWeek = null,
    monthOfYear = null,
    active = false,
    name = 'Unnamed Payment',
    id = 0,
    customDate = null,
  } = row;

  // Aggregate paid amount
  const [{ paid }] = await db
    .select({
      paid: sql`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId as any, dbUserId as any),
        eq(transactions.type, "expense"),
        eq(transactions.recurringId, idNum)
      )
    );

  const paidAmount = Number(paid || 0);
  const calculatedTotalAmount = Number(totalAmount || 0);
  const pending = Math.max(0, calculatedTotalAmount - paidAmount);

  // ---------- JSX ----------
  return (
    <div className="py-4 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/recurring"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-semibold">Recurring Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/recurring/${id}/edit${tabType ? `?tab=${tabType}` : ""}`}>Edit</Link>
          </Button>
          <Button asChild variant="default" size="sm">
            {/* ✅ Pay button → prefilled expense form */}
            <Link href={`/expense?recurringId=${id}&amount=${amount}`}>Pay</Link>
          </Button>
        </div>
      </div>

      {/* Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="truncate">{name}</span>
            {tabType && (
              <span className="text-xs rounded border px-2 py-0.5 capitalize">
                {tabType}
              </span>
            )}
            {tabCategoryLabel && (
              <span className="text-xs rounded border px-2 py-0.5">
                {tabCategoryLabel}
              </span>
            )}
            <span
              className={`text-xs ${
                active ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              {active ? "Active" : "Paused"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          {/* General info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <div className="text-muted-foreground">Due on</div>
              <div>{formatDate(nextDueDate)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Installment Amount</div>
              <div>{fmt(amount)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Frequency</div>
              <div className="capitalize">{row.frequency}</div>
            </div>

            {/* Show relevant date fields based on frequency */}
            {row.frequency === 'yearly' && (
              <>
                <div>
                  <div className="text-muted-foreground">Day of Month</div>
                  <div>{dayOfMonth || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Month of Year</div>
                  <div>{monthOfYear ? new Date(0, Number(monthOfYear) - 1).toLocaleString('default', { month: 'long' }) : '-'}</div>
                </div>
              </>
            )}

            {row.frequency === 'monthly' && (
              <div>
                <div className="text-muted-foreground">Day of Month</div>
                <div>{dayOfMonth || '-'}</div>
              </div>
            )}

            {row.frequency === 'weekly' && (
              <div>
                <div className="text-muted-foreground">Day of Week</div>
                <div>{
                  dayOfWeek !== null && dayOfWeek !== undefined && !isNaN(Number(dayOfWeek)) && Number(dayOfWeek) >= 0 && Number(dayOfWeek) <= 6 
                    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(dayOfWeek)] 
                    : '-'}
                </div>
              </div>
            )}

            {row.frequency === 'custom' && customDate && (
              <div>
                <div className="text-muted-foreground">Custom Date</div>
                <div>{formatDate(customDate)}</div>
              </div>
            )}

            {tabType === "emi" && (
              <>
                <div>
                  <div className="text-muted-foreground">Start Date</div>
                  <div>{formatDate(startDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">End Date</div>
                  <div>{formatDate(endDate)}</div>
                </div>
              </>
            )}

            {tabType !== "emi" && tabCategoryLabel && (
              <div>
                <div className="text-muted-foreground">Category</div>
                <div>{tabCategoryLabel}</div>
              </div>
            )}
          </div>

          {/* EMI-specific info */}
          {tabType === "emi" && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <div className="text-muted-foreground">Total Loan Amount</div>
                <div>{fmt(calculatedTotalAmount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Paid So Far</div>
                <div>{fmt(paidAmount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pending</div>
                <div className="text-amber-700 font-medium">{fmt(pending)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
