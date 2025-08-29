"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

// Minimal UI using existing styles (shadcn-like)
function Popup({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[92vw] max-w-sm shadow-lg">
      <div className="rounded-md border bg-background text-foreground">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-medium">Upcoming Payment</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

type UpcomingItem = {
  id: number;
  name: string;
  amount: string; // decimal as string
  nextDueDate: string; // yyyy-mm-dd
  paymentMethod: "upi" | "cash" | "credit_card" | null;
  accountId: number | null;
  creditCardId: number | null;
};

const DELAY_KEY = "recurring_delay_ids";

// ---- Delay helpers (session only) ----
function getDelayedSet(): Set<number> {
  try {
    const raw = sessionStorage.getItem(DELAY_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveDelayedSet(set: Set<number>) {
  try {
    sessionStorage.setItem(DELAY_KEY, JSON.stringify([...set]));
  } catch {}
}

// ---- Component ----
export default function RecurringAlertsClient() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/recurring/upcoming", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        const delayed = getDelayedSet();

        // API already filters paid & upcoming; we only apply delay filter here
        const filtered = (data.items as UpcomingItem[]).filter(
          (i) => !delayed.has(Number(i.id))
        );

        setItems(filtered);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getPayHref = (item: UpcomingItem) => {
    const p = new URLSearchParams();
    p.set("amount", item.amount);
    p.set("date", item.nextDueDate);
    if (item.paymentMethod) p.set("paymentMethod", item.paymentMethod);
    if (item.accountId != null) p.set("accountId", String(item.accountId));
    if (item.creditCardId != null) p.set("creditCardId", String(item.creditCardId));
    p.set("recurringId", String(item.id));
    return `/expense?${p.toString()}`;
  };

  const handleDelay = (id: number) => {
    const s = getDelayedSet();
    s.add(id);
    saveDelayedSet(s);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePay = (item: UpcomingItem) => {
    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    router.push(getPayHref(item));
  };

  if (loading || items.length === 0 || !isVisible) return null;

  return (
    <Popup onClose={() => setIsVisible(false)}>
      <div className="space-y-4">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
          {items.map((item) => (
            <div key={item.id} className="space-y-2 p-3 rounded-md border">
              <div>
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-blue-600">
                  Due on {item.nextDueDate} 
                </div>
                <div className="text-xs text-red-600">
                 Amount ₹{Number(item.amount).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePay(item)}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Pay
                </button>
                <button
                  type="button"
                  onClick={() => handleDelay(item.id)}
                  className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-2.5 text-xs"
                >
                  Delay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Popup>
  );
}
