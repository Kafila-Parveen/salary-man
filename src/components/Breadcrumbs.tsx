"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import React from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  ariaLabel?: string;
};

export default function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center text-sm text-muted-foreground">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  aria-label={item.ariaLabel || item.label}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-foreground" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
