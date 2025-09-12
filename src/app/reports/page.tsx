import { auth } from "@clerk/nextjs/server";
import { getReportData } from "@/lib/db/queries/reports";
import ReportsClient from "@/components/reports/ReportsClient";

export default async function ReportsPage({ searchParams }: { searchParams: any }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 🔹 Safe date string builder (avoids UTC shift issue)
  function formatDateLocalYMD(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const today = new Date();

  // ✅ First day of this month (always local)
  const defaultStart = formatDateLocalYMD(today.getFullYear(), today.getMonth() + 1, 1);

  // ✅ Today’s local date
  const defaultEnd = formatDateLocalYMD(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const startDate =
    searchParams?.mode === "tilldate"
      ? undefined
      : searchParams?.startDate ?? defaultStart;

  const endDate =
    searchParams?.mode === "tilldate"
      ? undefined
      : searchParams?.endDate ?? defaultEnd;

       // 🔹 Multi-select filters (forward from query params)
  const accountIds = searchParams?.account
  ? Array.isArray(searchParams.account)
    ? searchParams.account
    : [searchParams.account]
  : undefined;

  const creditCardIds = searchParams?.creditCard
  ? Array.isArray(searchParams.creditCard)
    ? searchParams.creditCard
    : [searchParams.creditCard]
  : undefined;

  const categoryIds = searchParams?.category
  ? Array.isArray(searchParams.category)
    ? searchParams.category
    : [searchParams.category]
  : undefined;


  const summary = await getReportData(userId, startDate, endDate, accountIds, creditCardIds, categoryIds);

  return <ReportsClient summary={summary} />;
}
