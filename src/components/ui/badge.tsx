import * as React from "react"

import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const base =
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  destructive: "bg-destructive text-destructive-foreground border-transparent",
  outline: "text-foreground",
}

function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn("border", base, variants[variant], className)}
      {...props}
    />
  )
}

export { Badge }
