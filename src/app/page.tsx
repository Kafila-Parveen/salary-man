"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, PieChart, BarChart2 } from "lucide-react";

// Lightweight, dependency-free chart primitives for the hero area
function MiniBarChart({
  series,
  height = 72,
}: {
  series: { label: string; color: string; data: number[] }[]
  height?: number
}) {
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.data)
  )
  const columns = series[0]?.data.length ?? 0
  return (
    <div className="grid grid-cols-6 items-end gap-2" style={{ height }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 items-end gap-1">
          {series.map((s) => {
            const v = s.data[i] ?? 0
            const h = Math.max(2, Math.round((v / max) * (height - 8)))
            return (
              <div
                key={s.label}
                className={`${s.color} rounded-sm`}
                style={{ height: h }}
                title={`${s.label}: ${v}`}
              />
            )
          })}
        </div>
      ))}
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

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="container flex items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6 text-primary" />
          <span>Salaryman</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">How it works</Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="outline">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <Button>Get started</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      {/* Hero */}
      <section className="container grid gap-6 px-4 pb-12 pt-6 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">New</Badge>
            <span className="text-muted-foreground text-sm">Smart budgets and bill tracking</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Take control of your money with clarity
          </h1>
          <p className="text-muted-foreground text-lg">
            Track income, expenses, credit cards, recurring payments, and savings — all in one dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="lg">Create your account</Button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="lg" variant="outline">Sign in</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button asChild size="lg">
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            </SignedIn>
          </div>
          <div className="text-muted-foreground text-sm">
            No credit card required. Cancel anytime.
          </div>
        </div>
        <div className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
                <CardDescription>Plan ahead and avoid surprises</CardDescription>
              </div>
              <BarChart2 className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent className="space-y-3 min-h-[160px]">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-sm bg-green-500" />
                <span className="text-muted-foreground">Income</span>
                <span className="ml-auto font-medium">$5,200</span>
              </div>
              <MiniBarChart
                height={68}
                series={[
                  { label: "Income", color: "bg-green-500", data: [4200, 4800, 5100, 5200, 5400, 5200] },
                  { label: "Expenses", color: "bg-red-500", data: [3300, 3600, 3800, 3950, 3700, 3850] },
                ]}
              />
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-sm bg-red-500" />
                <span className="text-muted-foreground">Expenses</span>
                <span className="ml-auto font-medium">$3,950</span>
              </div>
              <div className="text-muted-foreground text-xs">Based on the last 6 months</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Spending by Category</CardTitle>
                <CardDescription>See where your money goes</CardDescription>
              </div>
              <PieChart className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="space-y-3 min-h-[160px]">
              <div className="flex items-center gap-4">
                <DonutApprox
                  size={68}
                  thickness={12}
                  segments={[
                    { color: "#6366F1", pct: 35 }, // indigo-500
                    { color: "#10B981", pct: 18 }, // emerald-500
                    { color: "#F59E0B", pct: 12 }, // amber-500
                    { color: "#EC4899", pct: 8 }, // pink-500
                  ]}
                />
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <span className="text-muted-foreground">Housing</span>
                    <span className="ml-auto font-medium">35%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Groceries</span>
                    <span className="ml-auto font-medium">18%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Transport</span>
                    <span className="ml-auto font-medium">12%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                    <span className="text-muted-foreground">Entertainment</span>
                    <span className="ml-auto font-medium">8%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <CardTitle>Unified Accounts</CardTitle>
              </div>
              <CardDescription>Connect all your income sources and cards.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Get a single view of balances, transactions, and recurring bills.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                <CardTitle>Smart Budgets</CardTitle>
              </div>
              <CardDescription>Create budgets and track progress automatically.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Alerts keep you informed when you’re close to limits.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                <CardTitle>Insightful Reports</CardTitle>
              </div>
              <CardDescription>Understand spending patterns in seconds.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Visualize trends by merchant, category, and time.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container px-4 pb-10 text-center text-sm text-muted-foreground">
        Built with Next.js, Tailwind, shadcn/ui, Clerk, Drizzle & Neon
      </footer>
    </main>
  );
}