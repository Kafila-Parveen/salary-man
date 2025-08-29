"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";

interface Bank {
  readonly id: number;
  readonly name: string;
}

export default function CardFormClient({
  action,
  defaults,
  banks = [] as const,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: {
    name?: string;
    cardNumber?: string;
    creditLimit?: number | string | null;
    statementDate?: number | null;
    bankId?: number | null;
    bankName?: string | null;
  };
  banks?: readonly Bank[];
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected bank ID and other bank name from defaults
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [otherBankName, setOtherBankName] = useState("");
  
  // Set initial values when component mounts or defaults change
  useEffect(() => {
    if (defaults?.bankId !== undefined && defaults.bankId !== null) {
      setSelectedBankId(defaults.bankId);
    } else if (defaults?.bankName) {
      const bank = banks.find(b => b.name === defaults.bankName);
      if (bank) {
        setSelectedBankId(bank.id);
      } else {
        setSelectedBankId(0);
        setOtherBankName(defaults.bankName);
      }
    }
    
    // Set other default values if provided
    if (defaults?.name !== undefined) {
      formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.setAttribute('value', String(defaults.name || ''));
    }
    if (defaults?.cardNumber !== undefined) {
      formRef.current?.querySelector<HTMLInputElement>('input[name="cardNumber"]')?.setAttribute('value', String(defaults.cardNumber || ''));
    }
    if (defaults?.creditLimit !== undefined && defaults.creditLimit !== null) {
      formRef.current?.querySelector<HTMLInputElement>('input[name="creditLimit"]')?.setAttribute('value', String(defaults.creditLimit || ''));
    }
    if (defaults?.statementDate !== undefined && defaults.statementDate !== null) {
      formRef.current?.querySelector<HTMLInputElement>('input[name="statementDate"]')?.setAttribute('value', String(defaults.statementDate || ''));
    }
  }, [defaults, banks]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    
    // Get form values
    const formName = String(formData.get("name") || "").trim();
    const cardNumberRaw = String(formData.get("cardNumber") || "").trim();
    const cardNumberValue = cardNumberRaw.replace(/\D/g, "");
    const creditLimitValue = String(formData.get("creditLimit") || "").trim();
    const statementDateValue = String(formData.get("statementDate") || "").trim();
    const bankIdValue = String(formData.get("bankId") || "");
    const otherBankNameValue = String(formData.get("otherBankName") || "").trim();

    // Basic validation
    const nextErrors: Record<string, string> = {};

    if (!formName) nextErrors.name = 'Name is required';
    if (!cardNumberValue) nextErrors.cardNumber = 'Card number is required';
    if (!creditLimitValue) nextErrors.creditLimit = 'Credit limit is required';
    if (!statementDateValue) nextErrors.statementDate = 'Statement date is required';

    // Validate statement date is between 1-31
    const statementDay = statementDateValue ? Number(statementDateValue) : 0;
    const dayInRange = (day: number) => day >= 1 && day <= 31;
    
    if (statementDateValue && !dayInRange(statementDay)) {
      nextErrors.statementDate = 'Day must be 1-31';
    }

    // If bank is "Other", validate other bank name
    if (bankIdValue === '0' && !otherBankNameValue) {
      nextErrors.otherBankName = 'Please enter bank name';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // If we get here, form is valid
    setErrors({});
    setIsSubmitting(true);

    try {
      // Create form data to submit
      const submitData = new FormData();
      submitData.append('name', formName);
      submitData.append('cardNumber', cardNumberValue);
      submitData.append('creditLimit', creditLimitValue);
      submitData.append('statementDate', statementDateValue);
      submitData.append('bankId', bankIdValue);
      
      // Only append otherBankName if bank is "Other"
      if (bankIdValue === '0') {
        submitData.append('otherBankName', otherBankNameValue);
      }
      
      // Log the data being submitted for debugging
      const formDataObj: Record<string, any> = {};
      submitData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      console.log('Submitting form data:', formDataObj);
      
      // Call the server action
      const result = action(submitData);
      
      if (result instanceof Promise) {
        await result.catch((err: unknown) => {
          console.error('Form submission error:', err);
          setIsSubmitting(false);
          setErrors(prev => ({ 
            ...prev, 
            form: 'Failed to save card. Please try again.' 
          }));
        });
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setIsSubmitting(false);
      setErrors(prev => ({ 
        ...prev, 
        form: 'An unexpected error occurred. Please try again.' 
      }));
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8">
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 max-w-xl mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">Bank</label>
        <select
          name="bankId"
          required
          value={selectedBankId ?? ""}
          onChange={(e) => {
            const value = e.target.value ? Number(e.target.value) : null;
            setSelectedBankId(value);
          }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a bank</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
        
        {selectedBankId === 0 && (
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">Bank Name</label>
            <input
              name="otherBankName"
              type="text"
              value={otherBankName}
              onChange={(e) => setOtherBankName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter bank name"
            />
            {errors.otherBankName && <p className="mt-1 text-xs text-red-600">{errors.otherBankName}</p>}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Card Name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaults?.name ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g., HDFC Millennia"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Card Number</label>
        <input
          name="cardNumber"
          type="text"
          required
          defaultValue={defaults?.cardNumber ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="16-digit number"
          inputMode="numeric"
          autoComplete="cc-number"
          maxLength={16}
          onInput={(e) => {
            const t = e.currentTarget;
            t.value = t.value.replace(/\D/g, "").slice(0, 16);
          }}
        />
        {errors.cardNumber && <p className="mt-1 text-xs text-red-600">{errors.cardNumber}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Credit Limit</label>
          <input
            name="creditLimit"
            type="number"
            step="0.01"
            required
            defaultValue={defaults?.creditLimit ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="0.00"
          />
          {errors.creditLimit && <p className="mt-1 text-xs text-red-600">{errors.creditLimit}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Statement Date (day)</label>
          <input
            name="statementDate"
            type="number"
            min={1}
            max={31}
            required
            defaultValue={defaults?.statementDate ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g., 12"
          />
          {errors.statementDate && <p className="mt-1 text-xs text-red-600">{errors.statementDate}</p>}
        </div>
      </div>

      <div className="flex justify-center">
        <Button type="submit" className="min-w-40" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Card"}
        </Button>
      </div>
      </form>
    </div>
  );
}
