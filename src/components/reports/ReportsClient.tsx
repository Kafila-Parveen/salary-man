"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ReportFilters from "@/components/reports/ReportFilters";
import SummaryCards from "@/components/reports/SummaryCards";
import Charts from "@/components/reports/Charts";
import TransactionsTable from "@/components/reports/TransactionsTable";

interface Account {
  id: string;
  name: string;
  type: "Bank" | "Credit Card";
}

export default function ReportsClient({ summary: initialSummary }: any) {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();

  const [summary, setSummary] = useState(initialSummary);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]); // ✅ store accounts
  const [categories, setCategories] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);


  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const defaultEnd = today.toISOString().split("T")[0];

  // On first load, redirect to default month if no filters
  useEffect(() => {
    if (!user) return;
    
    if (!params.get("startDate") && !params.get("endDate") && !params.get("mode")) {
      const newParams = new URLSearchParams();
      newParams.set("startDate", defaultStart);
      newParams.set("endDate", defaultEnd);
      router.replace(`/reports?${newParams.toString()}`);
    }
  }, [user, params, router]);

  // Fetch summary + transactions whenever filters change
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const queryParams = new URLSearchParams({ clerkUserId: user.id });

      const startDate = params.get("startDate");
      const endDate = params.get("endDate");

      if (startDate) queryParams.set("startDate", startDate);
      if (endDate) queryParams.set("endDate", endDate);

      // Add all account filters
      params.getAll("account").forEach((acc) => queryParams.append("account", acc));
      // Add all credit card filters
      params.getAll("creditCard").forEach((cc) => queryParams.append("creditCard", cc));
      // Add all category filters
      params.getAll("category").forEach((cat) => queryParams.append("category", cat));

      try {
        const res = await fetch(`/api/reports?${queryParams.toString()}`);
        const data = await res.json();

        setSummary(data.summary ?? null);
        setTransactions(data.transactions ?? []);
        setCategories(data.categories ?? []);
        setAccounts(data.accounts ?? []);
        setCreditCards(data.creditCards ?? []);

        // ✅ if accounts are included in API response, set them
        if (data.accounts) setAccounts(data.accounts);
        if (data.creditCards) setCreditCards(data.creditCards);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      }
    };

    fetchData();
  }, [params, user]);

  // Guard: user not loaded
  if (!user) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading reports…</p>
      </div>
    );
  }

  // Guard: summary not ready
  if (!summary) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No summary data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Filters → pass accounts down */}
      <ReportFilters clerkUserId={user.id} accounts={accounts} creditCards={creditCards} categories={categories} />

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Charts */}
      <Charts transactions={transactions} categories={categories} />
      {/* Transaction Table */}
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
