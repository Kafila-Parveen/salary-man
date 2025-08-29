"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

export default function ExpenseFormClient({
  cats,
  cards,
  accounts,
  emis,
  action,
  defaults,
}: {
  cats: { id: number; name: string }[];
  cards: { id: number; name: string }[];
  accounts: { id: number; name: string }[];
  emis?: { id: number; name: string }[];
  action: (formData: FormData) => void;
  defaults?: {
    amount?: string;
    date?: string; // yyyy-mm-dd
    paymentMethod?: string;
    accountId?: number;
    creditCardId?: number;
    recurringId?: number;
  };
}) {
  const [paymentMethod, setPaymentMethod] = useState<string>(defaults?.paymentMethod || "cash");
  const hasCards = cards.length > 0;
  const hasAccounts = accounts && accounts.length > 0;
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dateText, setDateText] = useState<string>("");
  const [dateISO, setDateISO] = useState<string>("");
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const iso = defaults?.date;
    if (iso) {
      const [yyyy, mm, dd] = iso.split("-");
      setDateISO(iso);
      setDateText(`${dd}/${mm}/${yyyy}`);
      if (datePickerRef.current) datePickerRef.current.value = iso;
    } else {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      setDateText(`${dd}/${mm}/${yyyy}`);
      setDateISO(`${yyyy}-${mm}-${dd}`);
    }
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (submitting) {
      e.preventDefault();
      return;
    }
    
    const form = e.currentTarget;
    const fd = new FormData(form);
    const amount = Number(String(fd.get("amount") || "").trim());
    const categoryId = String(fd.get("categoryId") || "");
    const pm = String(fd.get("paymentMethod") || "");
    const creditCardId = String(fd.get("creditCardId") || "");
    const accountId = String(fd.get("accountId") || "");
    const date = dateISO; // Use the state directly instead of form data
    const recurringId = String(fd.get("recurringId") || "").trim();

    const nextErrors: Record<string, string> = {};
    if (!amount || isNaN(amount) || amount <= 0) nextErrors.amount = "Enter an amount greater than 0";
    if (!categoryId) nextErrors.categoryId = "Select a category";
    if (!date) nextErrors.date = "Select a valid date";
    
    // Only validate credit card if payment method is credit_card
    if (pm === "credit_card" && !creditCardId) {
      nextErrors.creditCardId = hasCards ? "Select a card" : "No cards available";
    }
    
    // Only validate account if payment method is UPI
    if (pm === "upi" && !accountId) {
      nextErrors.accountId = hasAccounts ? "Select a bank account" : "No bank accounts available";
    }

    if (Object.keys(nextErrors).length > 0) {
      e.preventDefault();
      setErrors(nextErrors);
      return;
    }

    // If we got here, form is valid
    setErrors({});
    setSubmitting(true);
    
    // Update the hidden date input field with the current dateISO value
    const dateInput = form.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput && date) {
      dateInput.value = date;
    }
  
  };

  return (
    <div className="px-4 sm:px-6 md:px-8">
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 max-w-xl mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="0.00"
          defaultValue={defaults?.amount || ""}
        />
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          name="categoryId"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue=""
        >
          <option value="" disabled>
            Select category
          </option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select
            name="paymentMethod"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI / Bank</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </div>
        {paymentMethod === "credit_card" && (
          <div>
            <label className="block text-sm font-medium mb-1">Credit Card</label>
            <select
              name="creditCardId"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults?.creditCardId ? String(defaults.creditCardId) : ""}
            >
              <option value="" disabled>
                {hasCards ? "Select credit card" : "No cards available"}
              </option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.creditCardId && <p className="mt-1 text-xs text-red-600">{errors.creditCardId}</p>}
          </div>
        )}
        {(paymentMethod === "upi" ) && (
          <div>
            <label className="block text-sm font-medium mb-1">Bank Account</label>
            <select
              name="accountId"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults?.accountId ? String(defaults.accountId) : ""}
            >
              <option value="" disabled>
                {hasAccounts ? "Select bank account" : "No bank accounts available"}
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.accountId && <p className="mt-1 text-xs text-red-600">{errors.accountId}</p>}
          </div>
        )}
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
                // Allow partial input like "1/" or "12/"
                if (v === '') {
                  setDateISO("");
                  if (datePickerRef.current) datePickerRef.current.value = "";
                  return;
                }
                
                // Format as user types
                let formatted = v.replace(/\D/g, ''); // Remove non-digits
                if (formatted.length > 8) return; // Don't allow more than 8 digits (ddmmyyyy)
                
                // Add slashes as user types
                if (formatted.length > 4) {
                  formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4)}`;
                } else if (formatted.length > 2) {
                  formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
                }
                
                setDateText(formatted);
                
                // Only update dateISO when we have a complete date
                const m = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (m) {
                  const [, dd, mm, yyyy] = m;
                  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
                  // Validate the date
                  if (date.getFullYear() === Number(yyyy) && 
                      date.getMonth() === Number(mm) - 1 && 
                      date.getDate() === Number(dd)) {
                    const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
                    setDateISO(iso);
                    if (datePickerRef.current) datePickerRef.current.value = iso;
                    return;
                  }
                }
                
                // If we get here, the date is invalid or incomplete
                setDateISO("");
                if (datePickerRef.current) datePickerRef.current.value = "";
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

      {/* Optional EMI linkage to compute pending balance */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium mb-1">Apply to EMI/SUBSCRIPTION/UTILITY (optional)</label>
          <Link href="/recurring" className="text-xs text-primary hover:underline">Manage EMIs</Link>
        </div>
        <select
          name="recurringId"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={defaults?.recurringId ? String(defaults.recurringId) : ""}
        >
          <option value="" disabled={!(emis && emis.length)}> {emis && emis.length ? "Select EMI" : "No EMIs found"} </option>
          {(emis || []).map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        {errors.recurringId && <p className="mt-1 text-xs text-red-600">{errors.recurringId}</p>}
        <p className="mt-1 text-xs text-muted-foreground">Selecting an EMI links this payment and reduces its pending amount.</p>
      </div>

      <div className="flex justify-center">
        <Button type="submit" className="min-w-40" disabled={submitting}>{submitting ? "Saving..." : "Save Expense"}</Button>
      </div>
      </form>
    </div>
  );
}
