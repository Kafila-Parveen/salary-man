"use client";

type Transaction = {
  id: number;
  date: string;
  type: string; // "income" | "expense" | "savings"
  category: string;
  account: string;
  amount: number;
  description: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); 
  // Output: 06 Sep 2025
}

export default function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-2xl shadow bg-white p-4 text-center text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <div className="rounded-2xl shadow bg-white p-4">
      <h2 className="text-lg font-semibold mb-2">Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Account</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b text-sm">
                <td className="px-4 py-2">{formatDate(tx.date)}</td>
                <td className="px-4 py-2 capitalize">{tx.type}</td>
                <td className="px-4 py-2">{tx.category}</td>
                <td className="px-4 py-2">{tx.account}</td>
                <td className="px-4 py-2 text-gray-600">
                  {tx.description || "-"}
                </td>
                <td
                  className={`px-4 py-2 font-medium ${
                    tx.type === "income"
                      ? "text-green-600"
                      : tx.type === "expense"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  ₹{tx.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
