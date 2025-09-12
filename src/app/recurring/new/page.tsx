import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db/drizzle";
import { accounts, creditCards, recurringPayments } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getOrCreateUserId } from "@/lib/auth";
import RecurringFormClient from "@/components/RecurringFormClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { computeNextRunDate } from "@/lib/recurring";

export default async function NewRecurringPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/recurring/new");

  const dbUserId = await getOrCreateUserId();

  const [accts, cards] = await Promise.all([
    db
      .select({ id: accounts.id, name: accounts.name })
      .from(accounts)
      .where(eq(accounts.userId as any, dbUserId as any)),
    db
      .select({ id: creditCards.id, name: creditCards.name })
      .from(creditCards)
      .where(eq(creditCards.userId as any, dbUserId as any)),
  ]);

  const accountOptions = accts.map((a) => ({ value: String(a.id), label: a.name }));
  const creditCardOptions = cards.map((c) => ({ value: String(c.id), label: c.name }));

  async function createRecurring(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/recurring/new");
    const dbUserId = await getOrCreateUserId();

    const tabType = String(formData.get("tabType") || "emi"); // "emi" | "subscription" | "utilitybill"
    const name = String(formData.get("name") || "").trim();
    const amountStr = String(formData.get("amount") || "").trim();
    const dayOfMonthStr = String(formData.get("dayOfMonth") || "").trim();
    const monthOfYearStr = String(formData.get("monthOfYear") || "").trim();
    const dayOfWeekStr = String(formData.get("dayOfWeek") || "").trim();
    const customDateStr = String(formData.get("customDate") || "").trim();

    const frequency = String(formData.get("frequency") || "monthly");
    const startDate = String(formData.get("startDate") || "").trim();
    const endDateStr = String(formData.get("endDate") || "").trim();

    const active = String(formData.get("active") || "") === "on";
    const billingDateStr = String(formData.get("billingDate") || "").trim();
    const totalAmountStr = String(formData.get("totalAmount") || "").trim();
    const categoryNameRaw = String(formData.get("categoryName") || "").trim();
    const customCategoryName = String(formData.get("customCategoryName") || "").trim();

    if (!name || !amountStr) redirect("/recurring/new?error=missing_fields");

    // Validation per frequency
    if (frequency === "monthly") {
      const day = Number(dayOfMonthStr);
      if (!day || day < 1 || day > 31) redirect("/recurring/new?error=invalid_day");
    }
    if (frequency === "yearly") {
      const month = Number(monthOfYearStr);
      const day = Number(dayOfMonthStr);
      if (!month || month < 1 || month > 12) redirect("/recurring/new?error=invalid_month");
      if (!day || day < 1 || day > 31) redirect("/recurring/new?error=invalid_day");
    }
    if (frequency === "weekly") {
      const dow = Number(dayOfWeekStr);
      if (Number.isNaN(dow) || dow < 0 || dow > 6) redirect("/recurring/new?error=invalid_dayofweek");
    }
    if (frequency === "custom") {
      if (!customDateStr) redirect("/recurring/new?error=missing_custom_date");
      if (isNaN(new Date(customDateStr).getTime())) redirect("/recurring/new?error=invalid_custom_date");
    }

    // Compute startDate per tab
    let startDateToUse: string | null = null;
    if (tabType === "emi") {
      startDateToUse = startDate || new Date().toLocaleDateString("en-CA");
    } else if (tabType === "subscription") {
      startDateToUse = billingDateStr || null;
    } else if (tabType === "utilitybill") {
      startDateToUse = startDate || null;
    }

    // Category
    const tabCategoryLabel =
      (categoryNameRaw.toLowerCase() === "others" ? customCategoryName : categoryNameRaw).trim() || null;

    // Normalize optional fields
    const totalAmountVal = tabType === "emi" && totalAmountStr ? Number(totalAmountStr) : null;

    // Build normalized object (for next due date calculation)
    const normalized: any = {
      userId: dbUserId,
      name,
      amount: Number(amountStr),
      dayOfMonth: dayOfMonthStr ? Number(dayOfMonthStr) : null,
      monthOfYear: monthOfYearStr ? Number(monthOfYearStr) : null,
      dayOfWeek: dayOfWeekStr ? Number(dayOfWeekStr) : null,
      customDate: customDateStr || null,
      frequency,
      active,
      tabType,
      tabCategoryLabel,
      startDate: startDateToUse,
      endDate: endDateStr || null,
      categoryId: null,
      paymentMethod: null,
      totalAmount: totalAmountVal,
    };

    // Compute next due date
    const nextDue = computeNextRunDate(normalized);

    // Prepare insert values
    const insertValues: any = {
      ...normalized,
      nextDueDate: nextDue ? nextDue.toLocaleDateString("en-CA") : null,
    };

    await db.insert(recurringPayments).values(insertValues);

    redirect("/recurring");
  }

  return (
    <div className="container py-10 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recurring", href: "/recurring" },
          { label: "Add Recurring" },
        ]}
        className="mb-2 max-w-xl"
      />
      <div className="mb-6 flex items-center justify-between max-w-xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Recurring Payment</h1>
          <p className="text-muted-foreground">Create a subscription or bill reminder</p>
        </div>
      </div>
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Recurring</CardTitle>
          </CardHeader>
          <CardContent>
            <RecurringFormClient
              action={createRecurring}
              accountOptions={accountOptions}
              creditCardOptions={creditCardOptions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
