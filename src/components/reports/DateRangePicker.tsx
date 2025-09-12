"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"

interface DateRangePickerProps {
  value: { from: string; to: string }
  onChange: (val: { from: string; to: string }) => void
  label?: string
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: value.from ? new Date(value.from) : undefined,
    to: value.to ? new Date(value.to) : undefined,
  })

  const handleSelect = (selected: DateRange | undefined) => {
    setRange(selected)
    onChange({
      from: selected?.from ? format(selected.from, "yyyy-MM-dd") : "",
      to: selected?.to ? format(selected.to, "yyyy-MM-dd") : "",
    })
  }

  return (
    // relative so PopoverContent (absolute) is positioned correctly and doesn't push layout
    <div className="relative inline-block">
      <Popover>
        {/* Keep simple — just use PopoverTrigger with child Button */}
        <PopoverTrigger>
          <Button
            id="date"
            variant="outline"
            className="w-[260px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, "LLL dd, y")} -{" "}
                  {format(range.to, "LLL dd, y")}
                </>
              ) : (
                format(range.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>

        {/* absolute so it overlays and does not change parent's height */}
        <PopoverContent className="absolute left-0 z-50 mt-2 w-auto p-0">
          <Calendar
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
