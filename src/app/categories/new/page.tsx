import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { db } from "@/db/drizzle";
import { categories } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CategoryFormClient from "@/components/CategoryFormClient";
import { getOrCreateUserId } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function NewCategoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/categories/new");

  async function createCategory(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/categories/new");

    const dbUserId = await getOrCreateUserId();
    const name = String(formData.get("name") || "").trim();
    const icon = String(formData.get("icon") || "").trim() || null;

    if (!name) redirect("/categories/new?error=missing_fields");

    await db.insert(categories).values({
      userId: dbUserId as any,
      name,
      type: 'expense' as const, // Default to 'expense' type
      icon: icon as any,
    });

    redirect("/categories");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Categories", href: "/categories" },
          { label: "Add Category" },
        ]}
        className="mb-2 max-w-xl"
      />
      <div className="mb-6 flex items-center justify-between max-w-xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Category</h1>
          <p className="text-muted-foreground">Create a new expense category</p>
        </div>
      </div>
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryFormClient action={createCategory} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
