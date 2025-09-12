"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import MultiSelectFilter from "./MultiSelectFilter";
import { DateRangePicker } from "./DateRangePicker";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

interface Item {
  id: string;
  name: string;
}

interface ReportFiltersProps {
  clerkUserId: string;
  accounts: Item[];
  creditCards: Item[];
  categories: Item[];
}

export default function ReportFilters({
  clerkUserId,
  accounts,
  creditCards,
  categories,
}: ReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const [filters, setFilters] = useState<{
    startDate: string;
    endDate: string;
    account: string[];
    creditCard: string[];
    category: string[];
    type: string[];
  }>({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    account: searchParams.getAll("account"),
    creditCard: searchParams.getAll("creditCard"),
    category: searchParams.getAll("category"),
    type: searchParams.getAll("type"),
  });

  const today = new Date();

  // Apply custom filters
  const applyFilters = () => {
    if (!clerkUserId) return;

    const params = new URLSearchParams();
    params.set("clerkUserId", clerkUserId);

    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);

    if (filters.account.length) {
      filters.account.forEach((accId) => params.append("account", accId));
    }

    if (filters.creditCard.length) {
      filters.creditCard.forEach((ccId) => params.append("creditCard", ccId));
    }

    if (filters.category.length) {
      filters.category.forEach((catId) => params.append("category", catId));
    }

    if (filters.type.length) {
      filters.type.forEach((t) => params.append("type", t));
    }

    router.push(`/reports?${params.toString()}`);
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      account: [],
      creditCard: [],
      category: [],
      type: [],
    });
    router.push("/reports");
  };
  const applyQuickFilter = (start?: Date, end?: Date, mode?: string) => {
    const params = new URLSearchParams();
  
    const formatDate = (date: Date) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split("T")[0];
    };
  
    if (mode === "alltime") {
      params.set("mode", "alltime");
      params.delete("startDate");
      params.delete("endDate");
      setActiveQuick("alltime");
    } else if (mode === "tilldate") {
      params.set("endDate", formatDate(new Date()));
      params.set("mode", "tilldate");
      params.delete("startDate");
      setActiveQuick("tilldate");
    } else if (start && end) {
      params.set("startDate", formatDate(start));
      params.set("endDate", formatDate(end));
      params.delete("mode");
  
      if (start.getMonth() === today.getMonth() && start.getFullYear() === today.getFullYear()) {
        setActiveQuick("thisMonth");
      } else if (start.getMonth() === subMonths(today, 1).getMonth()) {
        setActiveQuick("prevMonth");
      } else if (start.getFullYear() === today.getFullYear()) {
        setActiveQuick("thisYear");
      }
    }
  
    router.push(`/reports?${params.toString()}`);
  };
  

  return (
    <div className="space-y-6">
      {/* Quick Filters + Advanced Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
        <Button
          variant={activeQuick === "alltime" ? "default" : "outline"}
          onClick={() => applyQuickFilter(undefined, undefined, "alltime")}
        >
          All Time
        </Button>
        <Button
          variant={activeQuick === "tilldate" ? "default" : "outline"}
          onClick={() => applyQuickFilter(undefined, undefined, "tilldate")}
        >
          Till Date
        </Button>
        <Button
          variant={activeQuick === "thisMonth" ? "default" : "outline"}
          onClick={() => applyQuickFilter(startOfMonth(today), endOfMonth(today))}
        >
          This Month
        </Button>
        <Button
          variant={activeQuick === "prevMonth" ? "default" : "outline"}
          onClick={() => {
            const prev = subMonths(today, 1);
            applyQuickFilter(startOfMonth(prev), endOfMonth(prev));
          }}
        >
          Previous Month
        </Button>
        <Button
          variant={activeQuick === "thisYear" ? "default" : "outline"}
          onClick={() => applyQuickFilter(startOfYear(today), today)}
        >
          This Year
        </Button>

        </div>

        <Button variant="outline" className="bg-gray-300 hover:bg-gray-400 transition-colors" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? "Hide Advanced Filters" : "Advanced Filters"}
        </Button>
      </div>

      {/* Advanced Filters with animation */}
      <AnimatePresence>
  {showAdvanced && (
    <motion.div
      key="advanced-filters"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-visible"
    >
      <div className="rounded-2xl border bg-white p-6 shadow-md space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date Range */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Date Range
                  </label>
                  <DateRangePicker
                    value={{ from: filters.startDate, to: filters.endDate }}
                    onChange={(val) =>
                      setFilters({
                        ...filters,
                        startDate: val.from,
                        endDate: val.to,
                      })
                    }
                  />
                </div>

                {/* Accounts */}
                
                <MultiSelectFilter
                  label="Accounts"
                  options={accounts.map((a) => ({ id: String(a.id), name: a.name }))}
                  value={filters.account}
                  onChange={(val) => setFilters({ ...filters, account: val })}
                />

                {/* Credit Cards */}
                <MultiSelectFilter
                  label="Credit Cards"
                  options={creditCards.map((c) => ({ id: String(c.id), name: c.name }))}
                  value={filters.creditCard}
                  onChange={(val) => setFilters({ ...filters, creditCard: val })}
                />

                {/* Categories */}
                <MultiSelectFilter
                  label="Categories"
                  options={categories.map((cat) => ({ id: String(cat.id), name: cat.name }))}
                  value={filters.category}
                  onChange={(val) => setFilters({ ...filters, category: val })}
                />

                {/* Type */}
                <MultiSelectFilter
                  label="Type"
                  options={[
                    { id: "income", name: "Income" },
                    { id: "expense", name: "Expense" },
                    { id: "savings", name: "Savings" },
                  ]}
                  value={filters.type}
                  onChange={(val) => setFilters({ ...filters, type: val })}
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button onClick={applyFilters}>Apply</Button>
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

