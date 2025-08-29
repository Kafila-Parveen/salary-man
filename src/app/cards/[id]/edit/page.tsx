import CardFormClient from "@/components/CardFormClient";
import { db } from "@/db/drizzle";
import { creditCards } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUserId } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { DEFAULT_BANKS } from "@/constants/banks";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/cards");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) notFound();

  const dbUserId = await getOrCreateUserId();

  const existing = await db
    .select()
    .from(creditCards)
    .where(and(eq(creditCards.id as any, id as any), eq(creditCards.userId as any, dbUserId as any)))
    .limit(1);

  if (existing.length === 0) notFound();
  const card = existing[0];

  async function updateCard(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/cards");
    const dbUserId = await getOrCreateUserId();

    const name = String(formData.get("name") || "").trim();
    const rawCardNumber = String(formData.get("cardNumber") || "").trim();
    const creditLimit = String(formData.get("creditLimit") || "").trim();
    const statementDateStr = String(formData.get("statementDate") || "").trim();
    const bankId = String(formData.get("bankId") || "").trim();
    const otherBankName = String(formData.get("otherBankName") || "").trim();

    // Determine bank name based on selection
    const bankName = bankId === '0' 
      ? otherBankName 
      : DEFAULT_BANKS.find(b => b.id === Number(bankId))?.name || '';

    const normalizedCardNumber = rawCardNumber.replace(/\D/g, "");
    if (!name || !normalizedCardNumber || !creditLimit || !bankId) {
      redirect(`/cards/${id}/edit?error=missing_fields`);
    }
    if (!/^\d{16}$/.test(normalizedCardNumber)) {
      redirect(`/cards/${id}/edit?error=invalid_card_number`);
    }
    if (bankId === '0' && !otherBankName) {
      redirect(`/cards/${id}/edit?error=missing_bank_name`);
    }

    const statementDay = statementDateStr ? Number(statementDateStr) : undefined;
    const dueDay = statementDay
      ? (() => {
          const dueDate = new Date();
          dueDate.setDate(statementDay + 20);
          return dueDate.getDate();
        })()
      : undefined;

    await db
      .update(creditCards)
      .set({
        name,
        cardNumber: normalizedCardNumber,
        creditLimit: creditLimit as any,
        statementDate: statementDay,
        dueDate: dueDay,
        bankName
      })
      .where(
        and(
          eq(creditCards.id as any, id as any),
          eq(creditCards.userId as any, dbUserId as any)
        )
      );

    redirect("/cards");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Cards", href: "/cards" },
          { label: "Edit Card" },
        ]}
        className="mb-2 max-w-xl"
      />
      <div className="max-w-xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Edit Card</h1>
        </div>
        <CardFormClient
          action={updateCard}
          banks={DEFAULT_BANKS}
          defaults={{
            name: card.name || '',
            cardNumber: card.cardNumber || '',
            creditLimit: card.creditLimit || 0,
            statementDate: card.statementDate || null,
            bankName: card.bankName || '',
            // Set bankId if the bank exists in DEFAULT_BANKS
            bankId: DEFAULT_BANKS.find(b => b.name === card.bankName)?.id || null
          }}
        />
      </div>
    </div>
  );
}
