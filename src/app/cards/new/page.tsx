import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { creditCards } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CardFormClient from "@/components/CardFormClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getOrCreateUserId } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { DEFAULT_BANKS } from "@/constants/banks";

export default async function NewCardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/cards/new");

  // Use the predefined list of banks from constants
  const banksList = DEFAULT_BANKS;

    async function createCard(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/cards/new");

    const dbUserId = await getOrCreateUserId();
    if (!dbUserId) {
      redirect("/sign-in?error=user_not_found");
    }
    const bankId = Number(formData.get("bankId"));
    const otherBankName = formData.get("otherBankName") as string;
    
    if (!bankId && !otherBankName) {
      redirect("/cards/new?error=invalid_bank");
    }
    const name = String(formData.get("name") || "").trim();
    const rawCardNumber = String(formData.get("cardNumber") || "").trim();
    const creditLimit = String(formData.get("creditLimit") || "").trim();
    const statementDateStr = String(formData.get("statementDate") || "").trim();

    // Normalize and validate card number (must be exactly 16 digits)
    const normalizedCardNumber = rawCardNumber.replace(/\D/g, "");

    if (!name || !normalizedCardNumber || !creditLimit) {
      redirect("/cards/new?error=missing_fields");
    }

    if (!/^\d{16}$/.test(normalizedCardNumber)) {
      redirect("/cards/new?error=invalid_card_number");
    }

    // Prevent duplicate cards for the same user by card number
    const existing = await db
      .select({ id: creditCards.id })
      .from(creditCards)
      .where(
        and(
          eq(creditCards.userId as any, dbUserId as any),
          eq(creditCards.cardNumber as any, normalizedCardNumber as any)
        )
      )
      .limit(1);
    if (existing.length > 0) {
      redirect("/cards/new?error=duplicate_card");
    }

   
    const statementDay = statementDateStr ? Number(statementDateStr) : null;
    const dueDay = statementDay
      ? (() => {
          const now = new Date();
          const base = new Date(now.getFullYear(), now.getMonth(), statementDay);
          base.setDate(base.getDate() + 20);
          return base.getDate();
        })()
      : null;

    await db.insert(creditCards).values({
      userId: dbUserId.toString(),
      name,
      cardNumber: normalizedCardNumber,
      bankName: bankId !== 0 ? banksList.find(b => b.id === bankId)?.name || '' : otherBankName,
      creditLimit: creditLimit.toString(),
      availableLimit: creditLimit.toString(),
      statementDate: statementDay ?? 1, // Default to 1st if not provided
      dueDate: dueDay ?? 20, // Default to 20th if not provided
      isActive: true
    });

    redirect("/cards");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Cards", href: "/cards" },
          { label: "Add Card" },
        ]}
        className="mb-2 max-w-xl"
      />
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Credit Card</CardTitle>
          </CardHeader>
          <CardContent>
            <CardFormClient action={createCard} banks={banksList} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
