"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export type CardOption = { id: number; name: string };

export default function CreditCardSelector({
  cards,
  selectedId,
  className,
}: {
  cards: CardOption[];
  selectedId?: number;
  className?: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => cards.find((c) => c.id === selectedId) ?? cards[0], [cards, selectedId]);

  const onPick = (id: number) => {
    const params = new URLSearchParams(search?.toString());
    params.set("card", String(id));
    // preserve other params (e.g., range) automatically via URLSearchParams
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className="h-8 rounded-md border px-2 text-sm bg-transparent hover:bg-accent/40"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.name ?? "Select card"}
        <span className="ml-1 inline-block align-middle">▾</span>
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 min-w-40 rounded-md border bg-popover shadow-md"
        >
          {cards.map((c) => (
            <button
              key={c.id}
              role="option"
              aria-selected={c.id === selected?.id}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-accent/50 ${c.id === selected?.id ? "text-primary font-medium" : ""}`}
              onClick={() => onPick(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
