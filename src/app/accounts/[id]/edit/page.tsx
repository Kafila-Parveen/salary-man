import AccountFormClient from "@/components/AccountFormClient";
import { db } from "@/db/drizzle";
import { DEFAULT_BANKS } from "@/constants/banks";
import { accounts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getOrCreateUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/accounts");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) notFound();

  const dbUserId = await getOrCreateUserId();
  if (!dbUserId) redirect("/sign-in?redirect_url=/accounts");

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
    .where(and(eq(accounts.id as any, id as any), eq(accounts.userId as any, dbUserId as any)))
    .limit(1);

  if (rows.length === 0) notFound();
  const acct = rows[0];

  async function updateAccount(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect(`/sign-in?redirect_url=/accounts/${id}/edit`);
    const dbUserId = await getOrCreateUserId();

    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "").trim();
    const balanceStr = String(formData.get("balance") || "").trim();
    const accountNumberRaw = String(formData.get("accountNumber") || "").trim();
    const accountNumber = accountNumberRaw.replace(/\D/g, "");
    const bankName = String(formData.get("bankName") || "").trim();
    const customBankName = String(formData.get("customBankName") || "").trim();
    
    // Determine the final bank name to save
    let finalBankName = bankName;
    if (bankName === 'Other' && customBankName) {
      finalBankName = customBankName;
    } else if (!bankName) {
      // If no bank name is selected, keep the existing one
      finalBankName = acct.bankName || '';
    }

    if (!name || !type || !accountNumber) redirect(`/accounts/${id}/edit?error=missing_fields`);

    await db
      .update(accounts)
      .set({
        name,
        type: type as any,
        accountNumber: accountNumber as any,
        bankName: finalBankName as any,
        ...(balanceStr ? { balance: balanceStr as any } : {}),
      })
      .where(and(eq(accounts.id as any, id as any), eq(accounts.userId as any, dbUserId as any)));

    redirect("/accounts");
  }

  async function deleteAccount() {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect(`/sign-in?redirect_url=/accounts/${id}/edit`);
    const dbUserId = await getOrCreateUserId();

    await db.delete(accounts).where(and(eq(accounts.id as any, id as any), eq(accounts.userId as any, dbUserId as any)));
    redirect("/accounts");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Accounts", href: "/accounts" },
          { label: `Edit Account` },
        ]}
        className="mb-2 max-w-xl"
      />
      <div className="max-w-xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Account</h1>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this account and all its transactions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deleteAccount}>
                    <Button type="submit" variant="destructive">
                      Delete Account
                    </Button>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <AccountFormClient
          action={updateAccount}
          banks={DEFAULT_BANKS}
          defaults={{
            name: acct.name,
            type: acct.type,
            balance: acct.balance ?? "",
            accountNumber: acct.accountNumber ?? "",
            bankName: acct.bankName ?? ""
          }}
        />
      </div>
    </div>
  );
}
