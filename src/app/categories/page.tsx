import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db/drizzle";
import { categories } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getOrCreateUserId } from "@/lib/auth";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function CategoriesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/categories");

  const dbUserId = await getOrCreateUserId();
  const rows = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories)
    .where(eq(categories.userId as any, dbUserId as any));

  const hasCategories = rows.length > 0;

  async function deleteCategory(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/categories");
    const dbUserId = await getOrCreateUserId();
    const idStr = String(formData.get("id") || "").trim();
    const id = Number(idStr);
    if (!id || Number.isNaN(id)) return;
    await db
      .delete(categories)
      .where(
        and(
          eq(categories.id as any, id as any),
          eq(categories.userId as any, dbUserId as any)
        )
      );
    redirect("/categories");
  }

  return (
    <div className="container mx-auto py-8 pl-4 pr-4">
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categories" }]}
        className="mb-2"
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage expense categories</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Category: icon on small screens, text on md+ */}
          <Button asChild className="hidden md:inline-flex">
            <Link href="/categories/new">Add Category</Link>
          </Button>
          <Button asChild size="icon" className="md:hidden" aria-label="Add Category">
            <Link href="/categories/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Category</span>
            </Link>
          </Button>
        </div>
      </div>

      {!hasCategories ? (
        <Card>
          <CardHeader>
            <CardTitle>No categories yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create categories to organize your spending.</p>
            <div className="mt-3">
              <Button asChild>
                <Link href="/categories/new">Add Category</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border divide-y">
          {rows.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 px-4 py-3 ml-4 mr-4">
              <div className="min-w-0 flex items-center gap-2">
                <div className="font-medium truncate">{c.name}</div>
                {c.icon ? (
                  <span className="text-xs text-muted-foreground truncate">{c.icon}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="icon" className="h-8 w-8 p-0" aria-label="Edit category">
                  <Link href={`/categories/${c.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8 p-0" aria-label="Delete category">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete category?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the category.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={String(c.id)} />
                        <AlertDialogAction asChild>
                          <Button variant="destructive" type="submit">Delete</Button>
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
