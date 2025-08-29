import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db/drizzle";
import { creditCards } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUserId } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
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
import { Plus, CalendarDays, Clock, Pencil, Trash2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function CardsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/cards");

  const dbUserId = await getOrCreateUserId();

  async function deleteCard(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/cards");
    const dbUserId = await getOrCreateUserId();
    const idStr = String(formData.get("id") || "");
    const id = Number(idStr);
    if (!id || Number.isNaN(id)) return;
    await db.delete(creditCards).where(
      and(eq(creditCards.id as any, id as any), eq(creditCards.userId as any, dbUserId as any))
    );
    redirect("/cards");
  }

  const cards = await db
    .select({
      id: creditCards.id,
      name: creditCards.name,
      bankName: creditCards.bankName,
      cardNumber: creditCards.cardNumber,
      creditLimit: creditCards.creditLimit,
      availableLimit: creditCards.availableLimit,
      statementDate: creditCards.statementDate,
      dueDate: creditCards.dueDate,
    })
    .from(creditCards)
    .where(eq(creditCards.userId as any, dbUserId as any));

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cards" }]} className="mb-2" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
        <div className="flex items-center gap-2">
          {/* Add Card: text on md+, icon on small screens */}
          <Button asChild className="hidden md:inline-flex">
            <Link href="/cards/new">Add Card</Link>
          </Button>
          <Button asChild size="icon" className="md:hidden" aria-label="Add Card">
            <Link href="/cards/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Card</span>
            </Link>
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">No credit cards yet</p>
            <p className="text-muted-foreground text-sm">Add your first card to start tracking balances.</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button asChild size="sm"><Link href="/cards/new">Add Card</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => {
            const limit = Number(c.creditLimit ?? 0);
            const available = Number(c.availableLimit ?? limit);
            const balance = limit - available;
            return (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    {c.bankName && (
                      <p className="text-sm text-muted-foreground">{c.bankName}</p>
                    )}
                    {c.cardNumber && (
                      <p className="text-xs text-muted-foreground">
                        •••• {c.cardNumber.slice(-4)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 text-[11px] font-medium ring-1 ring-blue-200 dark:ring-blue-800 transition-colors hover:bg-blue-200/60">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      Stmt {c.statementDate ?? "-"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 text-[11px] font-medium ring-1 ring-amber-200 dark:ring-amber-800 transition-colors hover:bg-amber-200/60">
                      <Clock className="mr-1 h-3 w-3" />
                      Due {c.dueDate ?? "-"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="flex justify-between"><span>Limit</span><span>₹{limit.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Available</span><span>₹{available.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Used Credit</span><span>₹{balance.toLocaleString()}</span></div>
                  <div className="mt-3 flex justify-end gap-2">
                    {/* Edit - text on md+, icon on small */}
                    <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                      <Link href={`/cards/${c.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="icon" className="md:hidden" aria-label="Edit Card" title="Edit">
                      <Link href={`/cards/${c.id}/edit`} title="Edit">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>

                    {/* Delete - text on md+, icon on small */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="hidden md:inline-flex" variant="destructive" size="sm">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogTrigger asChild>
                        <Button className="md:hidden" variant="destructive" size="icon" aria-label="Delete Card" title="Delete">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete card?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the card and its related data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <form action={deleteCard}>
                            <input type="hidden" name="id" value={String(c.id)} />
                            <AlertDialogAction asChild>
                              <Button variant="destructive" size="sm" type="submit">Delete</Button>
                            </AlertDialogAction>
                          </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
