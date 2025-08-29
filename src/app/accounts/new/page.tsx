import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db/drizzle";
import { accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AccountFormClient from "@/components/AccountFormClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getOrCreateUserId } from "@/lib/auth";
import { DEFAULT_BANKS } from "@/constants/banks";

export default async function NewAccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/accounts/new");

  async function createAccount(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/accounts/new");

    const dbUserId = await getOrCreateUserId();
    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "").trim();
    const bankName = String(formData.get("bankName") || "").trim();
    const balanceStr = String(formData.get("balance") || "0").trim();
    const accountNumberRaw = String(formData.get("accountNumber") || "").trim();
    const accountNumber = accountNumberRaw.replace(/\D/g, "");
    const isLoan = type.startsWith("loan_");
    const interestRate = isLoan ? formData.get("interestRate") : null;

    if (!name || !type || !accountNumber) {
      return redirect("/accounts/new?error=missing_fields");
    }

    const accountData: any = {
      userId: dbUserId,
      name,
      type,
      accountNumber,
      balance: balanceStr,
      isLoan,
      bankName: isLoan ? 'N/A' : (bankName || 'Cash')
    };

    if (isLoan && interestRate) {
      accountData.interestRate = interestRate.toString();
    }

    await db.insert(accounts).values(accountData);
    redirect("/accounts");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Accounts", href: "/accounts" },
          { label: "Add Account" },
        ]}
        className="mb-2 max-w-xl"
      />
      <div className="mb-6 flex items-center justify-between max-w-xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Account</h1>
          <p className="text-muted-foreground">Create a bank, cash, or loan account</p>
        </div>
      </div>
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6">
          <AccountFormClient 
            action={createAccount}
            banks={DEFAULT_BANKS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
