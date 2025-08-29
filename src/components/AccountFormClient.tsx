"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { DEFAULT_BANKS } from "@/constants/banks";

interface AccountFormClientProps {
  action: (formData: FormData) => Promise<void> | void;
  defaults?: { 
    name?: string; 
    type?: string; 
    balance?: string | number; 
    accountNumber?: string;
    bankId?: number;
    bankName?: string;
    isLoan?: boolean;
    interestRate?: number;
  };
  banks?: ReadonlyArray<{ id: number; name: string }>;
}

export default function AccountFormClient({
  action,
  defaults = {},
  banks = []
}: AccountFormClientProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const banksList = banks || DEFAULT_BANKS;
  const [isLoan, setIsLoan] = useState(defaults?.isLoan || false);
  
  // Filter out the 'Other' option from the default banks since we'll add it separately
  const filteredBanks = (banksList || []).filter(bank => bank.name !== 'Other');
  
  // Initialize with the default bank name if it exists and isn't in the default banks list
  const isDefaultBank = filteredBanks.some(bank => bank.name === defaults?.bankName);
  const [selectedBankName, setSelectedBankName] = useState<string>(
    defaults?.bankName && (isDefaultBank || defaults.bankName === 'Other') 
      ? defaults.bankName 
      : ''
  );
  const [customBankName, setCustomBankName] = useState<string>(
    !isDefaultBank && defaults?.bankName && defaults.bankName !== 'Other' 
      ? defaults.bankName 
      : ''
  );
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    setIsLoan(selectedType.startsWith('loan_'));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const type = String(fd.get("type") || "").trim();
    const balance = String(fd.get("balance") || "0").trim();
    const accountNumber = String(fd.get("accountNumber") || "").trim();
    const bankName = String(fd.get("bankName") || "").trim();
    const customBankName = String(fd.get("customBankName") || "").trim();
    const finalBankName = bankName === 'Other' && customBankName ? customBankName : bankName;

    const errors: Record<string, string> = {};

    if (!name) errors.name = "Account name is required";
    if (!type) errors.type = "Account type is required";
    
    // Handle bank name validation
    if (!isLoan) {
      if (bankName === 'Other' && !customBankName) {
        errors.bankName = "Please enter a bank name";
      } else if (!bankName) {
        errors.bankName = "Bank name is required";
      }
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    // Create a new form data object with the correct bank name
    const form = e.currentTarget;
    const newFormData = new FormData(form);
    
    // If we have a custom bank name, use that instead of 'Other'
    if (finalBankName && finalBankName !== 'Other') {
      newFormData.set('bankName', finalBankName);
    }

    // Clear any previous errors
    setErrors({});
    
    // Submit the form with the updated form data
    try {
      const result = action(newFormData);
      if (result && typeof result === 'object' && 'catch' in result) {
        (result as Promise<void>).catch(console.error);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8">
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 max-w-xl mx-auto">
      <div className="grid gap-1">
        <label className="text-sm font-medium">Account Name</label>
        <input name="name" className="border rounded-md px-3 py-2 bg-background" placeholder="e.g., ICICI Savings" defaultValue={defaults?.name ?? ""} />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Account Number</label>
        <input name="accountNumber" className="border rounded-md px-3 py-2 bg-background" placeholder="digits only" defaultValue={defaults?.accountNumber ?? ""} />
        {errors.accountNumber && <p className="text-sm text-red-600">{errors.accountNumber}</p>}
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Account Type</label>
        <select 
          name="type" 
          className="border rounded-md px-3 py-2 bg-background" 
          defaultValue={defaults?.type ?? ""}
          onChange={handleTypeChange}
        >
          <option value="">Select type</option>
          <option value="savings">Savings</option>
          <option value="current">Current</option>
          <option value="loan_personal">Personal Loan</option>
          <option value="loan_car">Car Loan</option>
          <option value="loan_home">Home Loan</option>
          <option value="cash">Cash</option>
        </select>
        {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
      </div>

      {!isLoan && (
        <div className="grid gap-1">
          <label className="text-sm font-medium">Bank</label>
          <select 
            name="bankName" 
            className="border rounded-md px-3 py-2 bg-background mb-2 w-full"
            value={selectedBankName}
            onChange={(e) => {
              setSelectedBankName(e.target.value);
              if (e.target.value !== 'Other') {
                setCustomBankName('');
              }
            }}
            required={!isLoan}
          >
            <option value="">Select bank</option>
            {filteredBanks.map((bank) => (
              <option key={bank.id} value={bank.name}>
                {bank.name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
          {(selectedBankName === 'Other' || (!selectedBankName && customBankName) || 
            (!filteredBanks.some(bank => bank.name === selectedBankName) && selectedBankName)) && (
            <div className="mt-2">
              <input
                type="text"
                name="customBankName"
                className="border rounded-md px-3 py-2 bg-background w-full"
                placeholder="Enter bank name"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
                required={selectedBankName === 'Other'}
              />
            </div>
          )}
        </div>
      )}

      {isLoan && (
        <div className="grid gap-1">
          <label className="text-sm font-medium">Loan Details</label>
          <input 
            type="number"
            step="0.01"
            name="interestRate" 
            className="border rounded-md px-3 py-2 bg-background" 
            placeholder="Interest rate %"
            defaultValue={defaults?.interestRate ?? ""}
          />
        </div>
      )}

      <div className="grid gap-1">
        <label className="text-sm font-medium">Starting Balance (optional)</label>
        <input name="balance" className="border rounded-md px-3 py-2 bg-background" placeholder="0" defaultValue={defaults?.balance ?? ""} />
        {errors.balance && <p className="text-sm text-red-600">{errors.balance}</p>}
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
