"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export default function CategoryFormClient({
  action,
  defaults,
}: {
  action: (formData: FormData) => void;
  defaults?: { name?: string; icon?: string };
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const icon = String(fd.get("icon") || "").trim();

    const next: Record<string, string> = {};
    if (!name) next.name = "Enter a category name";
    if (name.length > 100) next.name = "Name must be 100 characters or fewer";
    if (icon && icon.length > 64) next.icon = "Icon must be 64 characters or fewer";

    if (Object.keys(next).length > 0) {
      e.preventDefault();
      setErrors(next);
    } else {
      setErrors({});
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8">
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 max-w-xl mx-auto">
      <div className="grid gap-1">
        <label className="text-sm font-medium">Category Name</label>
        <input
          name="name"
          className="border rounded-md px-3 py-2 bg-background"
          placeholder="e.g., Grocery"
          defaultValue={defaults?.name ?? ""}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Icon (optional)</label>
        <input
          name="icon"
          className="border rounded-md px-3 py-2 bg-background"
          placeholder="e.g., shopping-bag"
          defaultValue={defaults?.icon ?? ""}
        />
        {errors.icon && <p className="text-sm text-red-600">{errors.icon}</p>}
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}
