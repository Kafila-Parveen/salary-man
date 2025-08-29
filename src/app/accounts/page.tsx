import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db/drizzle";
import { accounts, users } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getOrCreateUserId } from "@/lib/auth";

export default async function AccountsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/accounts");

  const dbUserId = await getOrCreateUserId();
  const rows = await db
    .select({ 
      id: accounts.id, 
      name: accounts.name, 
      type: accounts.type, 
      balance: accounts.balance, 
      accountNumber: accounts.accountNumber,
      bankName: accounts.bankName 
    })
    .from(accounts)
    .where(eq(accounts.userId as any, dbUserId as any));

  const hasAccounts = rows.length > 0;

  return (
    <div className="container mx-auto py-8 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Accounts" },
        ]}
        className="mb-2"
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your bank, cash, and loan accounts</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Account: text on md+, icon on small screens */}
          <Button asChild className="hidden md:inline-flex">
            <Link href="/accounts/new">Add Account</Link>
          </Button>
          <Button asChild size="icon" className="md:hidden" aria-label="Add Account">
            <Link href="/accounts/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Account</span>
            </Link>
          </Button>
        </div>
      </div>

      {!hasAccounts ? (
        <Card>
          <CardHeader>
            <CardTitle>No accounts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create your first account to record balances and transactions.</p>
            <div className="mt-3">
              <Button asChild>
                <Link href="/accounts/new">Add Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{a.name}</span>
                  <span className="text-xs rounded border px-2 py-0.5 capitalize">{a.type}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className="text-2xl font-semibold">₹{Number(a.balance || 0).toFixed(2)}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <div>{a.bankName}</div>
                  <div className="mt-1">
                    {(() => {
                      const digits = String(a.accountNumber || "");
                      const last4 = digits.slice(-4);
                      return `•••• •••• •••• ${last4}`;
                    })()}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/accounts/${a.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
