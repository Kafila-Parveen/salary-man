"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState, useEffect } from "react";
import { MONTH_NAMES, DAY_NAMES } from "@/constants/date";

type Option = { value: string; label: string };
type ActionResult = { redirect?: string; error?: string };
export type TabType = "emi" | "subscription" | "utilitybill";

interface RecurringFormClientProps {
  action: (formData: FormData) => Promise<ActionResult | void>;
  defaults?: {
    name?: string;
    amount?: string | number;
    totalAmount?: string | number;
    dayOfMonth?: number;
    monthOfYear?: string; // stored as "1–12" in DB, shown as month name in UI
    dayOfWeek?: string;   // stored as "0–6" in DB, shown as day name in UI
    customDate?: string;  
    active?: boolean;
    categoryName?: string | null;   // previously selected category
    customCategoryName?: string;    // previously entered custom category
    frequency?: "yearly" | "monthly" | "weekly" | "custom";
    startDate?: string | null;
    endDate?: string | null;
  };
  accountOptions: Option[];
  creditCardOptions: Option[];
  initialTab?: TabType;
}

type CategoryMap = {
  [key in TabType]: { value: string; label: string }[];
};

const CATEGORY_OPTIONS: CategoryMap = {
  emi: [
    { value: 'car_loan', label: 'Car Loan' },
    { value: 'personal_loan', label: 'Personal Loan' },
    { value: 'home_loan', label: 'Home Loan' },
    { value: 'education_loan', label: 'Education Loan' },
    { value: 'credit_card_loan', label: 'Credit Card Loan' },
    { value: 'others', label: 'Others' },
  ],
  subscription: [
    { value: 'netflix', label: 'Netflix' },
    { value: 'hotstar', label: 'Hotstar' },
    { value: 'amazon_prime', label: 'Amazon Prime' },
    { value: 'spotify', label: 'Spotify' },
    { value: 'youtube_premium', label: 'YouTube Premium' },
    { value: 'others', label: 'Others' },
  ],
  utilitybill: [
    { value: 'water_bill', label: 'Water Bill' },
    { value: 'gas_bill', label: 'Gas Bill' },
    { value: 'electricity_bill', label: 'Electricity Bill' },
    { value: 'broadband', label: 'Broadband' },
    { value: 'others', label: 'Others' },
  ],
};

export default function RecurringFormClient({
  action,
  defaults,
  accountOptions,
  creditCardOptions,
  initialTab,
}: RecurringFormClientProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || "emi");
  const [frequencyState, setFrequencyState] = useState<"yearly" | "monthly" | "weekly" | "custom">(
    (defaults?.frequency as "yearly" | "monthly" | "weekly" | "custom") || "monthly"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Controlled state for dropdowns ---
  const [monthOfYear, setMonthOfYear] = useState<string>(
    defaults?.monthOfYear ? MONTH_NAMES[parseInt(defaults.monthOfYear) - 1] : ""
  ); // ✅ Added: converts DB number to month name for UI
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    defaults?.dayOfWeek ? DAY_NAMES[parseInt(defaults.dayOfWeek)] : ""
  ); // ✅ Added: converts DB number to day name for UI
  const [customDate, setCustomDate] = useState<string>(
    defaults?.customDate || ""
  );

 // --- Category handling ---
const initialCategory = defaults?.categoryName || "";
const initialCustomCategory = defaults?.customCategoryName || "";

// Check if the initial category is a predefined option in the current tab
const isPredefinedCategory =
  initialCategory &&
  CATEGORY_OPTIONS[activeTab].some((opt) => opt.value === initialCategory);

// Check if it's a custom category (not predefined, but has a name)
const isCustomCategory =
  initialCategory &&
  !isPredefinedCategory &&
  initialCategory !== "others";

// State for category
const [categoryName, setCategoryName] = useState<string>(
  isPredefinedCategory
    ? initialCategory
    : isCustomCategory
    ? "others"
    : "select-placeholder"
);

// State for custom category name
const [customCategoryName, setCustomCategoryName] = useState<string>(
  isCustomCategory ? initialCategory : initialCustomCategory || ""
);


  // --- Handle Submit ---
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});
    
    const form = e.currentTarget;
    const fd = new FormData(form);

    const tabType = String(fd.get("tabType") || activeTab);
    fd.set("tabType", tabType);

    // --- Extract values ---
    const name = String(fd.get("name") || "").trim();
    const amountStr = String(fd.get("amount") || "").trim();
    const frequency = String(fd.get("frequency") || frequencyState || "yearly");
    const startDate = String(fd.get("startDate") || "").trim();
    const endDate = String(fd.get("endDate") || "").trim();
    const totalAmountStr = String(fd.get("totalAmount") || "").trim();
    const dayOfMonthValue = String(fd.get("dayOfMonth") || "").trim();
    const monthOfYearValue = monthOfYear; // ✅ Added: controlled UI value
    const dayOfWeekValue = dayOfWeek;     // ✅ Added: controlled UI value
    const customDateValue = customDate;   // ✅ Added: controlled UI value

    // --- Merge category ---
    let categoryFinal = categoryName;
    if (categoryName === "others" && customCategoryName) {
      const formattedCustomName = customCategoryName.trim().toLowerCase().replace(/\s+/g, "_");
      categoryFinal = formattedCustomName;
      setCustomCategoryName(formattedCustomName);
    }
    
    fd.set("categoryName", categoryFinal);
    fd.set("customCategoryName", customCategoryName);

    // --- Convert month/day names back to DB values ---
    if (frequency === "yearly" && monthOfYearValue) {
      const monthIndex = MONTH_NAMES.indexOf(monthOfYearValue) + 1;
      fd.set("monthOfYear", String(monthIndex));
    }
    if (frequency === "weekly" && dayOfWeekValue) {
      const dayIndex = DAY_NAMES.indexOf(dayOfWeekValue);
      fd.set("dayOfWeek", String(dayIndex));
    }

    try {
      const result = await action(fd);
      if (result?.error) setErrors({ form: result.error });
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({ form: "An error occurred while saving. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8">
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as TabType)} defaultValue={initialTab || "emi"}>
        <TabsList className="grid grid-cols-3 w-full max-w-xl mx-auto">
          <TabsTrigger value="emi">EMI</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="utilitybill">Utility Bills</TabsTrigger>
        </TabsList>

        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-5 sm:gap-6 w-full max-w-3xl mx-auto mt-4 px-4"
        >
          <input type="hidden" name="tabType" value={activeTab} />

          {/* Name & Amount */}
          <div className="grid gap-1 w-full">
            <label className="text-sm font-medium">Name</label>
            <Input 
              name="name" 
              placeholder="Enter name"
              className="h-12 text-base w-full"
              defaultValue={defaults?.name ?? ""} 
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="grid gap-1 w-full">
            <label className="text-sm font-medium">Amount</label>
            <Input 
              type="number" 
              step="0.01" 
              min="0" 
              name="amount" 
              placeholder="0.00"
              className="h-12 text-base w-full"
              defaultValue={defaults?.amount ? String(defaults.amount) : ""} 
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* Frequency */}
          <div className="grid gap-1 w-full">
            <label className="text-sm font-medium">Frequency</label>
            <Select name="frequency" value={frequencyState} onValueChange={(v) => setFrequencyState(v as any)}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frequency-specific fields */}
          {frequencyState === "yearly" && (
            <>
              <div className="grid gap-1 w-full">
                <label className="text-sm font-medium">Month</label>
                <Select name="monthOfYear" value={monthOfYear} onValueChange={setMonthOfYear}>
                  <SelectTrigger className="h-12 text-base w-full">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1 w-full">
                <label className="text-sm font-medium">Day of Month</label>
                <Input 
                  name="dayOfMonth" 
                  type="number" 
                  min={1} 
                  max={31} 
                  placeholder="Enter day (1-31)"
                  className="h-12 text-base w-full"
                  defaultValue={defaults?.dayOfMonth ?? ""} 
                />
              </div>
            </>
          )}
          {frequencyState === "monthly" && (
            <div className="grid gap-1 w-full">
              <label className="text-sm font-medium">Day of Month</label>
              <Input 
                name="dayOfMonth" 
                type="number" 
                min={1} 
                max={31} 
                placeholder="Enter day (1-31)"
                className="h-12 text-base w-full"
                defaultValue={defaults?.dayOfMonth ?? ""} 
              />
            </div>
          )}
          {frequencyState === "weekly" && (
            <div className="grid gap-1 w-full">
              <label className="text-sm font-medium">Day of Week</label>
              <Select name="dayOfWeek" value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="h-12 text-base w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {frequencyState === "custom" && (
            <div className="grid gap-1 w-full">
              <label className="text-sm font-medium">Custom Date</label>
              <Input 
                name="customDate" 
                type="date" 
                className="h-12 text-base w-full"
                value={customDate} 
                onChange={(e) => setCustomDate(e.target.value)} 
              />
            </div>
          )}

          {/* EMI-specific */}
          {activeTab === "emi" && (
            <>
              <div className="grid gap-1 w-full">
                <label className="text-sm font-medium">Start Date</label>
                <Input 
                  name="startDate" 
                  type="date" 
                  className="h-12 text-base w-full"
                  defaultValue={defaults?.startDate ?? ""} 
                />
              </div>
              <div className="grid gap-1 w-full">
                <label className="text-sm font-medium">End Date</label>
                <Input 
                  name="endDate" 
                  type="date" 
                  className="h-12 text-base w-full"
                  defaultValue={defaults?.endDate ?? ""} 
                />
              </div>
              <div className="grid gap-1 w-full">
                <label className="text-sm font-medium">Total Amount</label>
                <Input 
                  name="totalAmount" 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter total amount"
                  className="h-12 text-base w-full"
                  defaultValue={defaults?.totalAmount ? String(defaults.totalAmount) : ""} 
                />
              </div>
            </>
          )}

          {/* Category */}
          <div className="grid gap-2 w-full">
            <label className="text-sm font-medium">Category</label>
            <Select 
              name="categoryName" 
              value={categoryName}
              onValueChange={(value) => {
                setCategoryName(value);
                // Clear custom category when selecting a non-others option
                if (value !== "others") {
                  setCustomCategoryName('');
                }
              }}
            >
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select-placeholder" disabled>
                  Select a category
                </SelectItem>
                {CATEGORY_OPTIONS[activeTab].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(categoryName === "others" || isCustomCategory) && (
              <div className="grid gap-1 w-full">
                <label className="text-sm font-medium">Custom Category</label>
                <Input
                  name="customCategoryName"
                  placeholder="Enter custom category"
                  className="h-12 text-base mt-2 w-full"
                  value={customCategoryName}
                  onChange={(e) => {
                    setCustomCategoryName(e.target.value);
                  }}
                  onBlur={(e) => {
                    const formatted = e.target.value.toLowerCase().replace(/\s+/g, '_');
                    setCustomCategoryName(formatted);
                  }}
                  required={categoryName === "others"}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="active"
              name="active" 
              className="h-5 w-5"
              defaultChecked={defaults?.active ?? true} 
            />
            <label htmlFor="active" className="text-sm cursor-pointer">Active</label>
          </div>

          <Button 
            type="submit" 
            className="h-12 text-base font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </Tabs>
    </div>
  );
}
