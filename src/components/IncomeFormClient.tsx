"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default function IncomeFormClient({
  action,
  accounts = [],
  cards = [],
}: {
  action: (formData: FormData) => void;
  accounts?: { id: number; name: string }[];
  cards?: { id: number; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasAccounts = accounts.length > 0;
  const hasCards = cards.length > 0;
  const [applyToCard, setApplyToCard] = useState<boolean>(false);
  const [dateText, setDateText] = useState<string>("");
  const [dateISO, setDateISO] = useState<string>("");
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    setDateText(`${dd}/${mm}/${yyyy}`);
    setDateISO(`${yyyy}-${mm}-${dd}`);
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (submitting) {
      e.preventDefault();
      return;
    }
    const fd = new FormData(e.currentTarget);
    const amount = Number(String(fd.get("amount") || "").trim());
    const source = String(fd.get("source") || "").trim();
    const date = String(fd.get("date") || "").trim();
    const accountId = String(fd.get("accountId") || "");
    const applyCard = String(fd.get("applyToCard") || "") === "on";
    const creditCardId = String(fd.get("creditCardId") || "");

    const nextErrors: Record<string, string> = {};
    if (!amount || isNaN(amount) || amount <= 0) nextErrors.amount = "Enter an amount greater than 0";
    if (!source) nextErrors.source = "Enter a source";
    if (!date) nextErrors.date = "Select a date";
    if (!applyCard) {
      if (!accountId) nextErrors.accountId = hasAccounts ? "Select an account" : "No accounts available";
    } else {
      if (!creditCardId) nextErrors.creditCardId = hasCards ? "Select a card" : "No cards available";
    }

    if (Object.keys(nextErrors).length > 0) {
      e.preventDefault();
      setErrors(nextErrors);
    } else {
      setErrors({});
      setSubmitting(true);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 max-w-xl mx-auto">
      <div className="grid gap-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="applyToCard" checked={applyToCard} onChange={(e) => setApplyToCard(e.target.checked)} />
          Apply to Credit Card (refund/adjustment)
        </label>
        {!applyToCard && (
          <div className="grid gap-1">
            <label className="text-sm font-medium">Account</label>
            {hasAccounts ? (
              <select name="accountId" className="border rounded-md px-3 py-2 bg-background">
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground">No accounts yet.</div>
            )}
            {errors.accountId && <p className="text-sm text-red-600">{errors.accountId}</p>}
          </div>
        )}
        {applyToCard && (
          <div className="grid gap-1">
            <label className="text-sm font-medium">Credit Card</label>
            {hasCards ? (
              <select name="creditCardId" className="border rounded-md px-3 py-2 bg-background">
                <option value="">Select card</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground">No cards yet.</div>
            )}
            {errors.creditCardId && <p className="text-sm text-red-600">{errors.creditCardId}</p>}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="0.00"
        />
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Source of Income</label>
        <input
          name="source"
          type="text"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Salary, Freelance, etc."
        />
        {errors.source && <p className="mt-1 text-xs text-red-600">{errors.source}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/yyyy"
              value={dateText}
              onChange={(e) => {
                const v = e.target.value;
                setDateText(v);
                const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (m) {
                  const [, dd, mm, yyyy] = m;
                  const iso = `${yyyy}-${mm}-${dd}`;
                  setDateISO(iso);
                  if (datePickerRef.current) datePickerRef.current.value = iso;
                } else {
                  setDateISO("");
                  if (datePickerRef.current) datePickerRef.current.value = "";
                }
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="relative">
              <Button type="button" variant="outline" size="icon" aria-label="Pick date">
                <CalendarDays className="h-4 w-4" />
              </Button>
              <input
                ref={datePickerRef}
                type="date"
                value={dateISO}
                onChange={(e) => {
                  const iso = e.target.value; // yyyy-mm-dd
                  setDateISO(iso);
                  if (iso) {
                    const [yyyy, mm, dd] = iso.split("-");
                    setDateText(`${dd}/${mm}/${yyyy}`);
                  } else {
                    setDateText("");
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-hidden
              />
            </div>
          </div>
          <input type="hidden" name="date" value={dateISO} />
          {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <input
            name="description"
            type="text"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Notes"
          />
        </div>
      </div>
      <div className="flex justify-center">
        <Button type="submit" className="min-w-40" disabled={submitting}>{submitting ? "Saving..." : "Save Income"}</Button>
      </div>
      </form>
    </div>
  );
}
