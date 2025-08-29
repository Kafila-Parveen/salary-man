"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type PopoverContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export function Popover({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setUncontrolledOpen(v);
  };
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // close on outside click
  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      const triggerEl = triggerRef.current;
      const contentEl = contentRef.current;
      const clickInsideTrigger = !!(triggerEl && triggerEl.contains(target));
      const clickInsideContent = !!(contentEl && contentEl.contains(target));
      if (!clickInsideTrigger && !clickInsideContent) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <span className="relative inline-block">{children}</span>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error("PopoverTrigger must be used within Popover");
  const { open, setOpen, triggerRef } = ctx;

  if (!React.isValidElement(children)) return null;
  return React.cloneElement(children as any, {
    ref: triggerRef,
    "aria-expanded": open,
    onClick: (e: React.MouseEvent) => {
      (children as any).props?.onClick?.(e);
      setOpen(!open);
    },
  });
}

export function PopoverContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error("PopoverContent must be used within Popover");
  const { open, contentRef } = ctx;
  return open ? (
    <div
      ref={contentRef}
      role="dialog"
      className={cn(
        "absolute z-50 mt-2 min-w-[220px] rounded-md border bg-popover p-3 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        left: 0,
      }}
    >
      {children}
    </div>
  ) : null;
}
