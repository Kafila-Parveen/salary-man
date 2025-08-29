// import RecurringFormClient from "@/components/RecurringFormClient";
// import { db } from "@/db/drizzle";
// import { recurringPayments } from "@/db/schema";
// import { auth } from "@clerk/nextjs/server";
// import { and, eq, sql } from "drizzle-orm";
// import { notFound, redirect } from "next/navigation";
// import { getOrCreateUserId } from "@/lib/auth";
// import Breadcrumbs from "@/components/Breadcrumbs";
// import { computeNextRunDate } from "@/lib/recurring";
// import { MONTH_NAMES, DAY_NAMES } from "@/constants/date";

// interface PageProps {
//   params: { id: string };
//   searchParams?: { [key: string]: string | string[] | undefined };
// }

// export default async function EditRecurringPage({ params, searchParams }: PageProps) {
//   const searchParamsObj = searchParams || {};
//   const qTabRaw = searchParamsObj.tab;
//   const qTab = Array.isArray(qTabRaw) ? qTabRaw[0] : qTabRaw ?? "";

//   const validTabs = ["emi", "subscription", "utilitybill"] as const;
//   type TabType = (typeof validTabs)[number];

//   const { userId } = await auth();
//   if (!userId) redirect("/sign-in?redirect_url=/recurring");

//   const idParam = params?.id;
//   if (!idParam) notFound();
//   const id = Number(idParam);
//   if (Number.isNaN(id)) notFound();

//   const dbUserId = await getOrCreateUserId();
//   if (!dbUserId) redirect("/sign-in?redirect_url=/recurring");

//   try {
//     const [row] = await db
//       .select({
//         id: recurringPayments.id,
//         name: sql<string>`COALESCE(${recurringPayments.name}, '')`,
//         amount: sql<string>`COALESCE(${recurringPayments.amount}::numeric, 0)::text`,
//         dayOfMonth: recurringPayments.dayOfMonth,
//         active: sql<boolean>`COALESCE(${recurringPayments.active}, false)`,
//         frequency: recurringPayments.frequency,
//         startDate: recurringPayments.startDate,
//         endDate: recurringPayments.endDate,
//         tabType: recurringPayments.tabType,
//         tabCategoryLabel: sql<string>`COALESCE(${recurringPayments.tabCategoryLabel}, '')`,
//         totalAmount: sql<string>`COALESCE(${recurringPayments.totalAmount}::numeric, 0)::text`,
//         monthOfYear: recurringPayments.monthOfYear,
//         dayOfWeek: recurringPayments.dayOfWeek,
//         customDate: recurringPayments.customDate,
//         accountId: recurringPayments.accountId,
//         creditCardId: recurringPayments.creditCardId,
//         nextDueDate: recurringPayments.nextDueDate,
//       })
//       .from(recurringPayments)
//       .where(and(eq(recurringPayments.userId, dbUserId), eq(recurringPayments.id, id)))
//       .limit(1);

//     if (!row) return notFound();

//     const storedTab = row.tabType as TabType | undefined;
//     const initialTab: TabType = storedTab && validTabs.includes(storedTab) ? storedTab : "emi";

//     async function updateRecurring(formData: FormData) {
//       "use server";

//       const { userId } = await auth();
//       if (!userId) redirect(`/sign-in?redirect_url=/recurring/${id}/edit`);
//       const dbUserId = await getOrCreateUserId();

//       const name = String(formData.get("name") || "").trim();
//       const amountStr = String(formData.get("amount") || "").trim();
//       const frequency = String(formData.get("frequency") || "monthly");

//       const dayOfMonthStr = String(formData.get("dayOfMonth") || "").trim();
//       const monthOfYearStr = String(formData.get("monthOfYear") || "").trim();
//       const dayOfWeekStr = String(formData.get("dayOfWeek") || "").trim();
//       const customDateStr = String(formData.get("customDate") || "").trim();

//       let startDate = String(formData.get("startDate") || "").trim();
//       const endDateStr = String(formData.get("endDate") || "").trim();
//       const tabType = String(formData.get("tabType") || "").trim();
//       const totalAmountStr = String(formData.get("totalAmount") || "").trim();
//       const categoryName = String(formData.get("categoryName") || "").trim();
//       const active = String(formData.get("active") || "") === "on";

//       if (!name || !amountStr) redirect(`/recurring/${id}/edit?error=missing_fields`);
//       if (tabType === "emi" && !startDate) {
//         redirect(`/recurring/${id}/edit?error=missing_startdate`);
//       }
//       if (tabType !== "emi" && !startDate) {
//         const today = new Date();
//         startDate = today.toISOString().slice(0, 10);
//       }

//       // --- Validation ---
//       if (frequency === "yearly") {
//         const m = Number(monthOfYearStr);
//         const d = Number(dayOfMonthStr);
//         if (!m || Number.isNaN(m) || m < 1 || m > 12)
//           redirect(`/recurring/${id}/edit?error=invalid_month&tab=${tabType}`);
//         if (!d || Number.isNaN(d) || d < 1 || d > 31)
//           redirect(`/recurring/${id}/edit?error=invalid_day&tab=${tabType}`);
//       } else if (frequency === "monthly") {
//         const d = Number(dayOfMonthStr);
//         if (!d || Number.isNaN(d) || d < 1 || d > 31)
//           redirect(`/recurring/${id}/edit?error=invalid_day&tab=${tabType}`);
//       } else if (frequency === "weekly") {
//         const dow = Number(dayOfWeekStr);
//         if (Number.isNaN(dow) || dow < 0 || dow > 6)
//           redirect(`/recurring/${id}/edit?error=invalid_dayofweek&tab=${tabType}`);
//       } else if (frequency === "custom") {
//         if (!customDateStr || Number.isNaN(new Date(customDateStr).getTime()))
//           redirect(`/recurring/${id}/edit?error=invalid_customdate&tab=${tabType}`);
//       }

//       // --- Clear irrelevant fields ---
//       let dayOfMonth: number | null = null;
//       let monthOfYear: number | null = null;
//       let dayOfWeek: number | null = null;
//       let customDate: string | null = null;

//       if (frequency === "yearly") {
//         dayOfMonth = Number(dayOfMonthStr) || null;
//         monthOfYear = Number(monthOfYearStr) || null;
//       } else if (frequency === "monthly") {
//         dayOfMonth = Number(dayOfMonthStr) || null;
//       } else if (frequency === "weekly") {
//         dayOfWeek = Number(dayOfWeekStr) || null;
//       } else if (frequency === "custom") {
//         customDate = customDateStr || null;
//       }

//       // --- Compute next due date ---
//       const nextDueDate = computeNextRunDate(
//         {
//           frequency,
//           dayOfMonth,
//           monthOfYear,
//           dayOfWeek,
//           customDate,
//           startDate,
//         },
//         new Date()
//       );

//       await db
//         .update(recurringPayments)
//         .set({
//           name,
//           amount: Number(amountStr) as any,
//           frequency: frequency as any,
//           dayOfMonth,
//           monthOfYear,
//           dayOfWeek,
//           customDate,
//           startDate: startDate || null,
//           endDate: endDateStr || null,
//           active,
//           tabType: initialTab,
//           tabCategoryLabel: categoryName || null,
//           totalAmount: totalAmountStr ? totalAmountStr : null,
//           nextDueDate: nextDueDate ? nextDueDate.toLocaleDateString("en-CA") : null,
//         })
//         .where(and(eq(recurringPayments.id as any, id as any), eq(recurringPayments.userId as any, dbUserId as any)));

//       redirect("/recurring");
//     }

//     return (
//       <div className="space-y-6">
//         <Breadcrumbs
//           items={[
//             { label: "Recurring", href: "/recurring" },
//             { label: "Edit Recurring Payment" },
//           ]}
//         />
//         <div className="space-y-4">
//           <h1 className="text-2xl font-bold">Edit Recurring Payment</h1>
//           <RecurringFormClient
//             action={updateRecurring}
//             defaults={{
//               name: row.name,
//               amount: row.amount,
//               dayOfMonth: row.dayOfMonth ?? undefined,
//               monthOfYear: row.monthOfYear ? String(row.monthOfYear) : undefined,
//               dayOfWeek: row.dayOfWeek ? String(row.dayOfWeek) : undefined,
//               customDate: row.customDate ? String(row.customDate).slice(0, 10) : undefined,
//               active: row.active,
//               categoryName: row.tabCategoryLabel,
//               frequency:
//                 (row.frequency as "yearly" | "monthly" | "weekly" | "custom") || "monthly",
//               startDate: row.startDate ? String(row.startDate).slice(0, 10) : "",
//               endDate: row.endDate ? String(row.endDate).slice(0, 10) : undefined,
//               totalAmount: row.totalAmount,
//             }}
//             initialTab={initialTab}
//             accountOptions={[]} // TODO: fetch accounts
//             creditCardOptions={[]} // TODO: fetch credit cards
//             monthNames={MONTH_NAMES}
//             dayNames={DAY_NAMES}
//           />
//         </div>
//       </div>
//     );
//   } catch (error) {
//     console.error("Error fetching recurring payment:", error);
//     return notFound();
//   }
// }



import RecurringFormClient from "@/components/RecurringFormClient";
import { db } from "@/db/drizzle";
import { recurringPayments } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getOrCreateUserId } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { computeNextRunDate } from "@/lib/recurring";
import type { RecurringPayment } from "@/lib/recurring";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { error } from "console";

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

type Frequency = "yearly" | "monthly" | "weekly" | "custom";
const validTabs = ["emi", "subscription", "utilitybill"] as const;
type TabType = (typeof validTabs)[number];

// Helper: parse numbers but preserve 0. Returns number | null
function parseNumberOrNullNum(s: string | null | undefined): number | null {
  if (s === "" || s === null || s === undefined) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

export default async function EditRecurringPage({
  params,
  searchParams,
}: PageProps) {
  const searchParamsObj = searchParams || {};
  const qTabRaw = searchParamsObj.tab;
  const qTab = Array.isArray(qTabRaw) ? qTabRaw[0] : qTabRaw ?? "";

  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/recurring");

  const idParam = params?.id;
  if (!idParam) notFound();
  const id = Number(idParam);
  if (Number.isNaN(id)) notFound();

  const dbUserId = await getOrCreateUserId();
  if (!dbUserId) redirect("/sign-in?redirect_url=/recurring");

  try {
    const [row] = await db
      .select({
        id: recurringPayments.id,
        name: sql<string>`COALESCE(${recurringPayments.name}, '')`,
        amount: sql<string>`COALESCE(${recurringPayments.amount}::numeric, 0)::text`,
        dayOfMonth: recurringPayments.dayOfMonth,
        active: sql<boolean>`COALESCE(${recurringPayments.active}, false)`,
        frequency: recurringPayments.frequency,
        startDate: recurringPayments.startDate,
        endDate: recurringPayments.endDate,
        tabType: recurringPayments.tabType,
        tabCategoryLabel: sql<string>`COALESCE(${recurringPayments.tabCategoryLabel}, '')`,
        totalAmount: sql<string>`COALESCE(${recurringPayments.totalAmount}::numeric, 0)::text`,
        monthOfYear: recurringPayments.monthOfYear,
        dayOfWeek: recurringPayments.dayOfWeek,
        customDate: recurringPayments.customDate,
        accountId: recurringPayments.accountId,
        creditCardId: recurringPayments.creditCardId,
        nextDueDate: recurringPayments.nextDueDate,
      })
      .from(recurringPayments)
      .where(and(eq(recurringPayments.userId, dbUserId as any), eq(recurringPayments.id, id)))
      .limit(1);

    if (!row) return notFound();

    const storedTab = row.tabType as TabType | undefined;
    const initialTab: TabType = storedTab && validTabs.includes(storedTab) ? storedTab : "emi";

    async function updateRecurring(formData: FormData) {
      "use server";

      const { userId } = await auth();
      if (!userId) redirect(`/sign-in?redirect_url=/recurring/${id}/edit`);
      const dbUserId = await getOrCreateUserId();

      const name = String(formData.get("name") || "").trim();
      const amountStr = String(formData.get("amount") || "").trim();
      const frequency = (String(formData.get("frequency") || "monthly") as Frequency);

      const dayOfMonthStr = String(formData.get("dayOfMonth") || "").trim();
      const monthOfYearStr = String(formData.get("monthOfYear") || "").trim();
      const dayOfWeekStr = String(formData.get("dayOfWeek") || "").trim();
      const customDateStr = String(formData.get("customDate") || "").trim();

      let startDate = String(formData.get("startDate") || "").trim();
      const endDateStr = String(formData.get("endDate") || "").trim();
      const tabType = String(formData.get("tabType") || "").trim();
      const totalAmountStr = String(formData.get("totalAmount") || "").trim();
      const categoryName = String(formData.get("categoryName") || "").trim();
      const active = String(formData.get("active") || "") === "on";

      if (!name || !amountStr) redirect(`/recurring/${id}/edit?error=missing_fields`);
      if (tabType === "emi" && !startDate) {
        redirect(`/recurring/${id}/edit?error=missing_startdate`);
      }
      if (tabType !== "emi" && !startDate) {
        const today = new Date();
        startDate = today.toISOString().slice(0, 10);
      }

      // Validation
      if (frequency === "yearly") {
        const m = Number(monthOfYearStr);
        const d = Number(dayOfMonthStr);
        if (!m || Number.isNaN(m) || m < 1 || m > 12)
          redirect(`/recurring/${id}/edit?error=invalid_month&tab=${tabType}`);
        if (!d || Number.isNaN(d) || d < 1 || d > 31)
          redirect(`/recurring/${id}/edit?error=invalid_day&tab=${tabType}`);
      } else if (frequency === "monthly") {
        const d = Number(dayOfMonthStr);
        if (!d || Number.isNaN(d) || d < 1 || d > 31)
          redirect(`/recurring/${id}/edit?error=invalid_day&tab=${tabType}`);
      } else if (frequency === "weekly") {
        if (dayOfWeekStr === "") redirect(`/recurring/${id}/edit?error=invalid_dayofweek&tab=${tabType}`);
        const dow = Number(dayOfWeekStr);
        if (Number.isNaN(dow) || dow < 0 || dow > 6)
          redirect(`/recurring/${id}/edit?error=invalid_dayofweek&tab=${tabType}`);
      } else if (frequency === "custom") {
        if (!customDateStr || Number.isNaN(new Date(customDateStr).getTime()))
          redirect(`/recurring/${id}/edit?error=invalid_customdate&tab=${tabType}`);
      }

      // parse numeric values for computeNextRunDate (preserve zero)
      const dayOfMonthNum = parseNumberOrNullNum(dayOfMonthStr);
      const monthOfYearNum = parseNumberOrNullNum(monthOfYearStr);
      const dayOfWeekNum = parseNumberOrNullNum(dayOfWeekStr);
      const customDate = customDateStr || null;

      // Create a properly typed object for computeNextRunDate
      const recurringPayment: RecurringPayment = {
        id,
        userId: dbUserId,
        name,
        amount: amountStr,
        frequency,
        dayOfMonth: dayOfMonthNum,
        monthOfYear: monthOfYearNum !== null ? String(monthOfYearNum) : null,
        dayOfWeek: dayOfWeekNum !== null ? String(dayOfWeekNum) : null,
        customDate,
        startDate: startDate || null,
        endDate: endDateStr || null,
        nextDueDate: new Date().toISOString().split('T')[0], // Default to today, will be updated
        active: true,
        tabType: initialTab,
        tabCategoryLabel: categoryName || null,
        totalAmount: totalAmountStr || null,
        createdAt: new Date(),
      } as RecurringPayment;

      // compute next due date
      const nextDueDate = computeNextRunDate(recurringPayment);

      const nextDueStr = nextDueDate ? nextDueDate.toISOString().slice(0, 10) : undefined;

      // For DB: convert monthOfYear/dayOfWeek to strings (the schema expects string | undefined),
      // and ensure we pass undefined (not null) where Drizzle expects optional strings.
      const dbMonthOfYear = monthOfYearNum !== null ? String(monthOfYearNum) : undefined;
      const dbDayOfWeek = dayOfWeekNum !== null ? String(dayOfWeekNum) : undefined;

      await db
        .update(recurringPayments)
        .set({
          name,
          amount: Number(amountStr) as any,
          frequency: frequency as any,
          dayOfMonth: dayOfMonthNum as any, // numeric column
          monthOfYear: dbMonthOfYear as any,
          dayOfWeek: dbDayOfWeek as any,
          customDate: customDate || undefined,
          startDate: startDate || undefined,
          endDate: endDateStr || undefined,
          active: active as any,
          tabType: initialTab,
          tabCategoryLabel: categoryName || undefined,
          totalAmount: totalAmountStr ? totalAmountStr : undefined,
          nextDueDate: nextDueStr as any,
        })
        .where(and(eq(recurringPayments.id as any, id as any), eq(recurringPayments.userId as any, dbUserId as any)));

      redirect("/recurring");
    }

    return (
      <div className="container py-10 pl-4 pr-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Recurring", href: "/recurring" },
            { label: "Edit Recurring Payment" },
          ]}
          className="mb-2 max-w-xl"
        />
         <div className="mb-6 flex items-center justify-between max-w-xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Recurring Payment</h1>
        </div>
      </div>
      <div className="max-w-xl mx-auto">
      <Card>
          <CardContent>         
             <RecurringFormClient
            action={updateRecurring}
            defaults={{
              name: row.name,
              amount: row.amount,
              dayOfMonth: row.dayOfMonth ?? undefined,
              // convert numeric DB values to string so the form receives strings (avoids TS errors)
              monthOfYear: row.monthOfYear !== null && row.monthOfYear !== undefined ? String(row.monthOfYear) : undefined,
              dayOfWeek: row.dayOfWeek !== null && row.dayOfWeek !== undefined ? String(row.dayOfWeek) : undefined,
              customDate: row.customDate ? String(row.customDate).slice(0, 10) : undefined,
              active: row.active,
              categoryName: row.tabCategoryLabel,
              customCategoryName: row.tabCategoryLabel, 
              frequency: (row.frequency as Frequency) || "monthly",
              startDate: row.startDate ? String(row.startDate).slice(0, 10) : "",
              endDate: row.endDate ? String(row.endDate).slice(0, 10) : undefined,
              totalAmount: row.totalAmount,
            }}
            initialTab={initialTab}
            accountOptions={[]} // TODO: fetch user accounts if needed
            creditCardOptions={[]} // TODO: fetch user credit cards if needed
          />
        </CardContent>
      </Card>
      </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching recurring payment:", error);
    return notFound();
  }
}
