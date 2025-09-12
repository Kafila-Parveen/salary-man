import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BarChart2, PieChart, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { transactions, users, categories, accounts, creditCards } from "@/db/schema";
import { and, eq, gte, lte, inArray, desc, asc } from "drizzle-orm";
import CreditCardSelector from "@/components/CreditCardSelector";
import { getOrCreateUserId } from "@/lib/auth";

// Lightweight chart primitives (no external deps)
function MiniBarChart({
  series,
  height = 72,
}: {
  series: { label: string; color: string; data: number[] }[]
  height?: number
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.data))
  const columns = series[0]?.data.length ?? 0
  const nfmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
  return (
    <div className="relative">
      {/* subtle horizontal grid lines */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 border-t border-border/40" style={{ top: `${((i + 1) / 5) * 100}%` }} />
        ))}
      </div>
      <div
        className="relative grid items-end gap-2"
        style={{ height, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-1">
            {series.map((s) => {
              const v = s.data[i] ?? 0
              const h = Math.max(2, Math.round((v / max) * (height - 8)))
              return (
                <div key={s.label} className="relative">
                  {/* per-bar value label */}
                  <span className="pointer-events-none absolute -top-3 sm:-top-4 block text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap left-1/2 -translate-x-1/2">
                    {nfmt.format(v)}
                  </span>
                  <div
                    className={`${s.color} rounded-sm transition-all duration-500 ease-out`}
                    style={{ height: h }}
                    title={`${s.label}: ${nfmt.format(v)}`}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutApprox({
  segments,
  size = 88,
  thickness = 12,
}: {
  segments: { color: string; pct: number }[]
  size?: number
  thickness?: number
}) {
  const total = segments.reduce((a, b) => a + b.pct, 0) || 1
  let acc = 0
  const gradientStops = segments
    .map((s) => {
      const start = (acc / total) * 100
      acc += s.pct
      const end = (acc / total) * 100
      return `${s.color} ${start}%, ${s.color} ${end}%`
    })
    .join(", ")
  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        backgroundImage: `conic-gradient(${gradientStops})`,
        borderRadius: "50%",
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 m-auto rounded-full bg-card"
        style={{ width: size - thickness * 2, height: size - thickness * 2 }}
      />
    </div>
  )
}

export default async function DashboardPage({ searchParams: rawSearchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  // Extract search params at the top of the component
  const searchParams = rawSearchParams || {};
  const cardParam = searchParams?.card 
    ? (Array.isArray(searchParams.card) ? searchParams.card[0] : searchParams.card)
    : undefined;
  const range = searchParams?.range 
    ? (Array.isArray(searchParams.range) ? searchParams.range[0] : searchParams.range)
    : "recent";
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=/dashboard")
  const dbUserId = await getOrCreateUserId();

  // Build last 3 months window (including current month)
  const now = new Date();
  const months = 3;
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // end of current month
  const startRef = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1); // start of N months ago

  const monthKeys: string[] = [];
  const monthLabels: string[] = [];
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short" });
  for (let i = 0; i < months; i++) {
    const d = new Date(startRef.getFullYear(), startRef.getMonth() + i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    monthLabels.push(fmt.format(d));
  }

  // Fetch transactions in range for this user
  const rows = await db
    .select({ 
      id: transactions.id,
      amount: transactions.amount, 
      type: transactions.type, 
      date: transactions.date, 
      categoryId: transactions.categoryId, 
      paymentMethod: transactions.paymentMethod,
      description: transactions.description
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId as any, dbUserId as any),
        gte(transactions.date as any, startRef as any),
        lte(transactions.date as any, endDate as any)
      )
    )
    .orderBy(desc(transactions.date as any));

  const incomeSeries = Array(monthKeys.length).fill(0);
  const expenseSeries = Array(monthKeys.length).fill(0);
  const monthIndex = new Map(monthKeys.map((k, i) => [k, i]));

  for (const r of rows as any[]) {
    const d = new Date(r.date as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const idx = monthIndex.get(key);
    if (idx === undefined) continue;
    const amt = Number(r.amount);
    if (r.type === "income") incomeSeries[idx] += amt;
    else if (r.type === "expense") expenseSeries[idx] += amt;
  }

  // Categories breakdown for current month (expenses only)
  const curMonthKey = monthKeys[monthKeys.length - 1];
  const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const curMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthExpenseRows = rows.filter((r: any) => {
    const d = new Date(r.date as string);
    return r.type === "expense" && d >= curMonthStart && d <= curMonthEnd;
  });

  const byCat = new Map<number, number>();
  for (const r of monthExpenseRows as any[]) {
    const cid = r.categoryId as number | null;
    if (!cid) continue;
    const amt = Number(r.amount);
    byCat.set(cid, (byCat.get(cid) || 0) + amt);
  }
  const catIds = Array.from(byCat.keys());
  const catRows = catIds.length
    ? await db.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id as any, catIds as any))
    : [];
  const totalExp = Array.from(byCat.values()).reduce((a, b) => a + b, 0);
  const palette = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#A78BFA"];
  const categorySegments = catRows.map((c, i) => ({
    label: c.name,
    color: palette[i % palette.length],
    pct: totalExp > 0 ? Math.round((byCat.get(c.id)! / totalExp) * 100) : 0,
  }));

  const hasData = incomeSeries.some((v) => v > 0) || expenseSeries.some((v) => v > 0);

  // Fetch accounts for balances section
  const acctRows = await db
    .select({ id: accounts.id, name: accounts.name, type: accounts.type, balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.userId as any, dbUserId as any));

  // Credit utilization (selected card, default to first created)
  const ccRows = await db
    .select({ 
      id: creditCards.id, 
      creditLimit: creditCards.creditLimit, 
      currentBalance: creditCards.availableLimit, 
      name: creditCards.name 
    })
    .from(creditCards)
    .where(eq(creditCards.userId as any, dbUserId as any))
    .orderBy(asc(creditCards.createdAt as any));

  const selectedCardId = cardParam ? Number(cardParam) : undefined;
  const selectedCard = selectedCardId
    ? (ccRows || []).find((c: any) => Number(c.id) === selectedCardId)
    : (ccRows && ccRows.length > 0 ? ccRows[0] : undefined);

  const creditLimit = selectedCard ? Number(selectedCard.creditLimit || 0) : 0;
  const availableCredit = selectedCard ? Number(selectedCard.currentBalance || 0) : 0;
  const usedCredit = Math.max(0, creditLimit - availableCredit);
  // Use toFixed(1) to show one decimal place for better precision
  const utilizationPct = creditLimit > 0 ? 
    Math.min(100, Number(((usedCredit / creditLimit) * 100).toFixed(1))) : 0;
  
  // Debug log to verify values
  console.log({
    creditLimit,
    availableCredit,
    usedCredit,
    utilizationPct,
    currentBalance: selectedCard?.currentBalance,
    cardName: selectedCard?.name
  });

  // Currency formatter
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

  // This month totals
  const monthIncomeTotal = rows
    .filter((r: any) => {
      const d = new Date(r.date as string);
      return r.type === "income" && d >= curMonthStart && d <= curMonthEnd;
    })
    .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

  const monthExpenseTotal = rows
    .filter((r: any) => {
      const d = new Date(r.date as string);
      return r.type === "expense" && d >= curMonthStart && d <= curMonthEnd;
    })
    .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

  // Calculate savings (net income minus credit card expenses)
  const creditCardExpenses = rows
    .filter((r: any) => {
      const d = new Date(r.date as string);
      return r.type === "expense" && r.paymentMethod === 'credit_card' && d >= curMonthStart && d <= curMonthEnd;
    })
    .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
    
  const monthNet = monthIncomeTotal - monthExpenseTotal;
  const monthSavings = monthNet + creditCardExpenses; // Add back credit card expenses since they're not actual cash outflows

  // Recent/Last Month transactions
  const prevStart = new Date(curMonthStart.getFullYear(), curMonthStart.getMonth() - 1, 1);
  const prevEnd = new Date(curMonthStart.getFullYear(), curMonthStart.getMonth(), 0);

  const base = db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      description: transactions.description,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId as any, categories.id as any));

  const userFilter = eq(transactions.userId as any, dbUserId as any);

  let recentQuery;
  if (range === "this-month") {
    recentQuery = base
      .where(
        and(
          userFilter,
          gte(transactions.date as any, curMonthStart as any),
          lte(transactions.date as any, curMonthEnd as any)
        )
      )
      .orderBy(desc(transactions.date as any), desc(transactions.id as any));
  } else {
    // default: last 5 newest
    recentQuery = base
      .where(userFilter)
      .orderBy(desc(transactions.date as any), desc(transactions.id as any))
      .limit(5);
  }
  const recent = await recentQuery;

  return (
    <div className="container mx-auto py-8 pl-4 pr-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl pl-3 font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground pl-3">Your finances at a glance</p>
        </div>
        <div className="flex items-center gap-2 pr-3">
          <Button asChild variant="default" size="sm">
            <Link href="/income" aria-label="Add Income">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Add Income</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/expense" aria-label="Add Expense">
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Add Expense</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 pl-4 pr-4">
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.format(monthIncomeTotal)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.format(monthExpenseTotal)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Value</CardTitle>
            <Wallet className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.format(monthNet)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <Wallet className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.format(monthSavings)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pl-4 pr-4">
        {/* Credit Utilization */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Credit Utilization</CardTitle>
            <div className="flex items-center gap-2">
              <CreditCardSelector
                cards={(ccRows || []).map((c: any) => ({ id: Number(c.id), name: c.name }))}
                selectedId={selectedCard ? Number(selectedCard.id) : undefined}
              />
              <Badge variant="secondary">{utilizationPct.toFixed(1)}%</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[160px]">
            {selectedCard && creditLimit > 0 ? (
              <div className="flex items-center gap-4">
                <DonutApprox
                  size={72}
                  thickness={9}
                  segments={[
                    { color: "#dc2626", pct: Math.max(1, utilizationPct) }, // Ensure at least 1% visibility for used credit
                    { color: "#d1d5db", pct: Math.max(1, 100 - utilizationPct) },
                  ]}
                />
                <div className="grid gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#dc2626" }} />
                    <span className="text-muted-foreground">Used Credit</span>
                    <span className="ml-auto font-medium">{currency.format(usedCredit)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#d1d5db" }} />
                    <span className="text-muted-foreground">Available Credit</span>
                    <span className="ml-auto font-medium">{currency.format(availableCredit)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedCard?.name}: Limit {currency.format(creditLimit)} · {utilizationPct.toFixed(1)}% Utilization
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <p className="font-medium">No credit cards</p>
                  <p className="text-muted-foreground text-sm">Add a credit card to see utilization.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview Chart (last 3 months, smaller) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
            <BarChart2 className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent className="space-y-3 min-h-[160px]">
            {hasData ? (
              <MiniBarChart
                height={90}
                series={[
                  { label: "Income", color: "bg-emerald-500", data: incomeSeries },
                  { label: "Expense", color: "bg-rose-500", data: expenseSeries },
                ]}
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <p className="font-medium">No data yet</p>
                  <p className="text-muted-foreground text-sm">Connect or add your first record to see insights.</p>
                </div>
              </div>
            )}
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500" />
                <span className="text-muted-foreground">Expense</span>
              </div>
            </div>
            {/* Month labels aligned under bars */}
            <div
              className="grid text-[10px] text-muted-foreground"
              style={{ gridTemplateColumns: `repeat(${monthLabels.length}, minmax(0, 1fr))` }}
            >
              {monthLabels.map((m) => (
                <div key={m} className="text-center mt-1">{m}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
            <PieChart className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="space-y-3 min-h-[160px]">
            {categorySegments.length === 0 || categorySegments.every((c) => c.pct === 0) ? (
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <p className="font-medium">No categories yet</p>
                  <p className="text-muted-foreground text-sm">Add data to unlock your category breakdown.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <DonutApprox size={76} thickness={10} segments={categorySegments} />
                <div className="grid gap-2 text-sm">
                  {categorySegments.map((c) => (
                    <div className="flex items-center gap-2" key={c.label}>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-muted-foreground">{c.label}</span>
                      <span className="ml-auto font-medium">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 pl-4 pr-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{range === "this-month" ? "This Month Transactions" : "Recent Transactions"}</CardTitle>
            <div className="flex items-center gap-2">
              <Button asChild variant={range === "recent" ? "default" : "outline"} size="sm">
                <Link href="/dashboard?range=recent">Recent</Link>
              </Button>
              <Button asChild variant={range === "this-month" ? "default" : "outline"} size="sm">
                <Link href="/dashboard?range=this-month">This Month</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recent.length > 0 ? (
              <div className="divide-y">
                {recent.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.description || r.categoryName || "Transaction"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.date as string).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}</div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={r.type === "income" ? "text-green-600" : "text-red-600"}>
                        {r.type === "income" ? "+" : "-"}{currency.format(Number(r.amount))}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{r.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center">
                <p className="font-medium">No transactions yet</p>
                <p className="text-muted-foreground text-sm">When you add or import data, your recent activity will show up here.</p>
                <div className="mt-3 flex justify-center gap-2">
                  <Button size="sm" disabled>Import CSV</Button>
                  <Button size="sm" variant="secondary" disabled>Add Transaction</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
