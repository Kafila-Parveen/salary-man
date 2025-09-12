"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

type Summary = {
  income: number;
  expense: number;
  savings: number;
  totalIncome: number;  // Till Date / Overall
  totalExpense: number;
  totalSavings: number;
};

export default function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Income */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <ArrowDownCircle className="text-green-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Income</p>
            <p className="text-xl font-semibold">₹{summary.income}</p>
            <p className="text-xs text-gray-400">Till Date: ₹{summary.totalIncome}</p>
          </div>
        </CardContent>
      </Card>

      {/* Expense */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <ArrowUpCircle className="text-red-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Expense</p>
            <p className="text-xl font-semibold">₹{summary.expense}</p>
            <p className="text-xs text-gray-400">Till Date: ₹{summary.totalExpense}</p>
          </div>
        </CardContent>
      </Card>

      {/* Savings */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <Wallet className="text-blue-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Savings</p>
            <p className="text-xl font-semibold">₹{summary.savings}</p>
            <p className="text-xs text-gray-400">Till Date: ₹{summary.totalSavings}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
