import { recurringPayments } from "@/db/schema";

export type RecurringPayment = typeof recurringPayments.$inferSelect;

export function computeNextRunDate(r: RecurringPayment, today = new Date()): Date | null {
  // If no startDate, assume "today"
  const start = r.startDate ? new Date(String(r.startDate)) : today;
  const end = r.endDate ? new Date(String(r.endDate)) : null;

  if (isNaN(start.getTime())) return null;
  if (end && today > end) return null;

  // Clean "today" to midnight (avoid time issues)
  const todayClean = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // MONTHLY
  if (r.frequency === "monthly" && r.dayOfMonth) {
    const day = Number(r.dayOfMonth);

    // candidate this month
    let candidate = new Date(todayClean.getFullYear(), todayClean.getMonth(), day);

    if (candidate < todayClean) {
      // if already passed, move to next month
      let month = todayClean.getMonth() + 1;
      let year = todayClean.getFullYear();
      if (month > 11) {
        month = 0;
        year++;
      }
      candidate = new Date(year, month, day);
    }
    return candidate;
  }

  // WEEKLY
  if (r.frequency === "weekly" && r.dayOfWeek !== null && r.dayOfWeek !== undefined) {
    const dow = Number(r.dayOfWeek); // 0=Sunday
    const candidate = new Date(todayClean);
    candidate.setDate(todayClean.getDate() + ((7 + dow - todayClean.getDay()) % 7));

    if (candidate < todayClean) {
      candidate.setDate(candidate.getDate() + 7);
    }
    return candidate;
  }

  // YEARLY
if (r.frequency === "yearly" && r.monthOfYear && r.dayOfMonth) {
  const year = todayClean.getFullYear();
  const month = Number(r.monthOfYear) - 1; 
  const day = Number(r.dayOfMonth); 

  let candidate = new Date(year, month, day);

  if (candidate < todayClean) {
    candidate = new Date(year + 1, month, day);
  }
  return candidate;
}

  // CUSTOM
  if (r.frequency === "custom" && r.customDate) {
    const cd = new Date(r.customDate);
    return !isNaN(cd.getTime()) ? cd : null;
  }

  // Default: start date itself (if in future or today)
  return start >= todayClean ? start : null;
}
