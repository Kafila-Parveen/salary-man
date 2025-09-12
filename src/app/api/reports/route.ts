import { NextRequest, NextResponse } from "next/server";
import { getReportData } from "@/lib/db/queries/reports";
import { db } from "@/db/drizzle";
import { accounts, categories, creditCards, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Required
    const clerkUserId = searchParams.get("clerkUserId");
    if (!clerkUserId) {
      return NextResponse.json({ error: "Missing clerkUserId" }, { status: 400 });
    }

    // Optional filters
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Account IDs (multi-select)
    const accountIdsParam = searchParams.getAll("account"); // ?account=1&account=2
    const accountIds = accountIdsParam.length ? accountIdsParam : undefined;

    const creditCardIdsParam = searchParams.getAll("creditCard");
    const creditCardIds = creditCardIdsParam.length ? creditCardIdsParam : undefined;

    const categoryIdsParam = searchParams.getAll("category");
    const categoryIds = categoryIdsParam.length ? categoryIdsParam : undefined;

    const types = searchParams.getAll("type"); 

    // 🔹 Fetch report data
    const reportData = await getReportData(clerkUserId, startDate, endDate, accountIds, creditCardIds, categoryIds, types);

    // 🔹 Fetch accounts (instead of separate /api/accounts)
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerk_id, clerkUserId))
      .then((res) => res[0]);

    const userAccounts = user
      ? await db.select().from(accounts).where(eq(accounts.userId, user.id))
      : [];


    // 🔹 Fetch credit cards
    const userCreditCards = user
    ? await db.select().from(creditCards).where(eq(creditCards.userId, user.id))
    : [];

    const userCategories = user
    ? await db.select().from(categories).where(eq(categories.userId, user.id))
    : [];

    // 🔹 Return everything together
    return NextResponse.json({
      ...reportData,
      accounts: userAccounts,
      creditCards: userCreditCards, 
      categories: userCategories,
    });
  } catch (err: any) {
    console.error("Error fetching report data:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
