import CategoryFormClient from "@/components/CategoryFormClient";
import { db } from "@/db/drizzle";
import { categories } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getOrCreateUserId } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
 

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/categories");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) notFound();

  const dbUserId = await getOrCreateUserId();
  if (!dbUserId) redirect("/sign-in?redirect_url=/categories");

  const rows = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories)
    .where(and(eq(categories.id as any, id as any), eq(categories.userId as any, dbUserId as any)))
    .limit(1);

  if (rows.length === 0) notFound();
  const cat = rows[0];

  async function updateCategory(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect(`/sign-in?redirect_url=/categories/${id}/edit`);
    const dbUserId = await getOrCreateUserId();

    const name = String(formData.get("name") || "").trim();
    const icon = String(formData.get("icon") || "").trim() || null;

    if (!name) redirect(`/categories/${id}/edit?error=missing_fields`);

    await db
      .update(categories)
      .set({ name, icon: icon as any })
      .where(and(eq(categories.id as any, id as any), eq(categories.userId as any, dbUserId as any)));

    redirect("/categories");
  }

  return (
    <div className="container mx-auto py-10 pl-4 pr-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Categories", href: "/categories" },
          { label: "Edit Category" },
        ]}
        className="mb-2 max-w-xl"
      />
      <div className="max-w-xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Category</h1>
        </div>
        <CategoryFormClient
          action={updateCategory}
          defaults={{
            name: cat.name ?? "",
            icon: cat.icon ?? "",
          }}
        />
      </div>
    </div>
  );
}
