"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LegendProps,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LabelList,
} from "recharts";

type Transaction = {
  id: number;
  type: "income" | "expense";
  categoryId: string;
  amount: number | string;
  date: string;
};

type Category = {
  id: string;
  name: string;
};

function fmtLabel(label: unknown) {
  if (label == null) return "";
  if (typeof label === "number") return label.toLocaleString();
  if (typeof label === "string" && !Number.isNaN(Number(label))) {
    return Number(label).toLocaleString();
  }
  return String(label);
}

export default function Charts({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) 
 {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-80 p-4 rounded-2xl shadow bg-white flex items-center justify-center text-gray-500">
          No data available
        </div>
        <div className="h-80 p-4 rounded-2xl shadow bg-white flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Group month-wise (YYYY-MM)
  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((tx) => {
      const month = tx.date.slice(0, 7);
      const amt =
        typeof tx.amount === "string" ? Number(tx.amount) || 0 : tx.amount || 0;
      if (!map[month]) map[month] = { income: 0, expense: 0 };
      if (tx.type === "income") map[month].income += amt;
      else map[month].expense += amt;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month,
        income: vals.income || 0,
        expense: vals.expense || 0,
        savings: (vals.income || 0) - (vals.expense || 0),
      }));
  }, [transactions]);

 // Category-wise expense sums (from joined query data)
const categoryData = useMemo(() => {
  if (!transactions || transactions.length === 0) return [];

  const map: Record<string, number> = {};

  transactions.forEach((tx: any) => {
    if (tx.type === "expense") {
      const cat = tx.category || "Uncategorized"; // ✅ use category name from query
      const amt =
        typeof tx.amount === "string" ? Number(tx.amount) || 0 : tx.amount || 0;
      map[cat] = (map[cat] || 0) + amt;
    }
  });

  return Object.entries(map).map(([category, value]) => ({
    category,
    value: Number(value) || 0,
  }));
}, [transactions]);


  const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa", "#fb923c"];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="h-80 p-4 rounded-2xl shadow bg-white">
        <h2 className="text-lg font-semibold mb-2">
          Income vs Expense vs Savings
        </h2>
        <ResponsiveContainer width="100%" height="100%">
  <BarChart data={monthlyData} barCategoryGap="30%">
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip
      formatter={(value: unknown) =>
        value == null || isNaN(Number(value))
          ? "0"
          : Number(value).toLocaleString()
      }
    />
<Legend
  verticalAlign="bottom"
  height={36}
  content={() => (
    <ul className="flex justify-center space-x-4">
      <li className="flex items-center space-x-1">
        <span className="w-3 h-3 inline-block" style={{ background: "#f87171" }} />
        <span>Expense</span>
      </li>
      <li className="flex items-center space-x-1">
        <span className="w-3 h-3 inline-block" style={{ background: "#4ade80" }} />
        <span>Income</span>
      </li>
      <li className="flex items-center space-x-1">
        <span className="w-3 h-3 inline-block" style={{ background: "#60a5fa" }} />
        <span>Savings</span>
      </li>
    </ul>
  )}
/>


    {/* Income */}
    <Bar dataKey="income" fill="#4ade80" name="Income">
      <LabelList dataKey="income" position="top" formatter={fmtLabel} />
    </Bar>

    {/* Expense */}
    <Bar dataKey="expense" fill="#f87171" name="Expense">
      <LabelList dataKey="expense" position="top" formatter={fmtLabel} />
    </Bar>

    {/* Savings */}
    <Bar dataKey="savings" name="Savings" fill="#60a5fa">
  {monthlyData.map((d, index) => (
    <Cell
      key={`cell-${index}`}
      fill={d.savings >= 0 ? "#60a5fa" : "#a78bfa"}
    />
  ))}
  <LabelList dataKey="savings" position="top" formatter={fmtLabel} />
</Bar>
  </BarChart>
</ResponsiveContainer>

      </div>

      {/* Pie Chart */}
      <div className="h-80 p-4 rounded-2xl shadow bg-white">
        <h2 className="text-lg font-semibold mb-2">Expenses by Category</h2>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="category"
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) =>
                  value == null || isNaN(Number(value))
                    ? "0"
                    : Number(value).toLocaleString()
                }
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No expense data available
          </div>
        )}
      </div>
    </div>
  );
}
