import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db/drizzle";
import { recurringPayments, transactions } from "@/db/schema";
import type { InferSelectModel } from 'drizzle-orm';
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getOrCreateUserId } from "@/lib/auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { computeNextRunDate } from "@/lib/recurring";

type RecurringPayment = InferSelectModel<typeof recurringPayments>;

export default async function RecurringPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/recurring");

  const dbUserId = await getOrCreateUserId();
  if (!dbUserId) {
    throw new Error("Failed to get or create user ID");
  }

  const recurringPaymentsData = await db
    .select({
      id: recurringPayments.id,
      name: recurringPayments.name,
      amount: recurringPayments.amount,
      dayOfMonth: recurringPayments.dayOfMonth,
      active: recurringPayments.active,
      frequency: recurringPayments.frequency,
      startDate: recurringPayments.startDate,
      dayOfWeek: recurringPayments.dayOfWeek,
      monthOfYear: recurringPayments.monthOfYear,
      customDate: recurringPayments.customDate,
      nextDueDate: recurringPayments.nextDueDate,
      endDate: recurringPayments.endDate,
      totalAmount: recurringPayments.totalAmount,
      tabType: recurringPayments.tabType,
      tabCategoryLabel: recurringPayments.tabCategoryLabel,
      userId: recurringPayments.userId,
    })
    .from(recurringPayments)
    .where(eq(recurringPayments.userId, dbUserId));

  const now = new Date();
  const recurringWithNextDue = recurringPaymentsData.map((r) => ({
    ...r,
    nextDueDate: computeNextRunDate(r as RecurringPayment, now)?.toLocaleDateString("en-CA") || r.nextDueDate,
  }));

  // total paid for EMI
  const paidRows = await db
    .select({
      recurringId: transactions.recurringId,
      paid: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, dbUserId),
        eq(transactions.type, "expense")
      )
    )
    .groupBy(transactions.recurringId);

  const paidMap = new Map<number, number>();
  for (const pr of paidRows) {
    if (pr.recurringId != null) {
      paidMap.set(Number(pr.recurringId), Number(pr.paid));
    }
  }

  const hasRows = recurringWithNextDue.length > 0;

  async function deleteRecurring(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/recurring");

    const dbUserId = await getOrCreateUserId();
    if (!dbUserId) return;
    
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    // unlink transactions first
    await db
      .update(transactions)
      .set({ recurringId: null })
      .where(
        and(
          eq(transactions.userId, dbUserId),
          eq(transactions.recurringId, id)
        )
      );

    // delete recurring
    await db
      .delete(recurringPayments)
      .where(
        and(
          eq(recurringPayments.id, id),
          eq(recurringPayments.userId, dbUserId)
        )
      );

    redirect("/recurring");
  }

  return (
    <div className="container mx-auto py-8 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recurring" },
        ]}
        className="mb-2"
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Recurring Payments
          </h1>
          <p className="text-muted-foreground">
            Manage subscriptions and bills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden md:inline-flex">
            <Link href="/recurring/new">Add Recurring</Link>
          </Button>
          <Button
            asChild
            size="icon"
            className="md:hidden"
            aria-label="Add Recurring"
          >
            <Link href="/recurring/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Recurring</span>
            </Link>
          </Button>
        </div>
      </div>

      {!hasRows ? (
        <Card>
          <CardHeader>
            <CardTitle>No recurring payments yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create your first recurring payment to track bills.
            </p>
            <div className="mt-3">
              <Button asChild>
                <Link href="/recurring/new">Add Recurring</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recurringWithNextDue.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">
                      {r.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      ₹{Number(r.amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`text-xs rounded px-2 py-0.5 ${
                      r.active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-muted text-muted-foreground border"
                    }`}
                  >
                    {r.active ? "Active" : "Paused"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {r.frequency ? (
                    <span className="rounded border px-2 py-0.5 capitalize">
                      {String(r.frequency)}
                    </span>
                  ) : null}
                  {(() => {
                    return (
                      <span className="font-medium text-blue-500">
                        Due {r.nextDueDate.slice(0, 10)}
                      </span>
                    );
                  })()}
                  {r.tabType === 'emi' && r.startDate ? (
                    <span className="text-muted-foreground">
                      Start {String(r.startDate).slice(0, 10)}
                    </span>
                  ) : null}
                  {r.endDate ? (
                    <span className="text-muted-foreground">
                      End {String(r.endDate).slice(0, 10)}
                    </span>
                  ) : null}
                  {r.tabType ? (
                    <span className="text-muted-foreground capitalize">
                      {String(r.tabType)}
                    </span>
                  ) : null}
                  {r.tabCategoryLabel ? (
                    <span className="rounded border px-2 py-0.5">
                      {String(r.tabCategoryLabel)}
                    </span>
                  ) : null}
                  {r.tabType === "emi" && r.totalAmount ? (
                    <span className="text-amber-600">
                      Pending ₹
                      {Math.max(
                        0,
                        Number(r.totalAmount) - (paidMap.get(Number(r.id)) || 0)
                      ).toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0"
                    aria-label="View details"
                  >
                    <Link href={`/recurring/${r.id}`}>
                      {/* eye icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0"
                    aria-label="Edit recurring"
                  >
                    <Link
                      href={`/recurring/${r.id}/edit${
                        r.tabType ? `?tab=${String(r.tabType)}` : ""
                      }`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 p-0"
                        aria-label="Delete recurring"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete recurring payment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the recurring payment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form action={deleteRecurring}>
                          <input
                            type="hidden"
                            name="id"
                            value={String(r.id)}
                          />
                          <AlertDialogAction asChild>
                            <Button variant="destructive" type="submit">
                              Delete
                            </Button>
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
