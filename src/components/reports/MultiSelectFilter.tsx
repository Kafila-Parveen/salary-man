"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Option {
  id: string;
  name: string;
}

interface MultiSelectFilterProps {
  label: string;          // Label shown above
  options: Option[];      // List of items (accounts, credit cards, etc.)
  value: string[];        // Selected IDs
  onChange: (val: string[]) => void;
}

export default function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
}: MultiSelectFilterProps) {
  const allIds = options.map((o) => o.id);

  const toggleOption = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const toggleAll = () => {
    if (value.length === allIds.length) {
      onChange([]); // deselect all
    } else {
      onChange(allIds); // select all
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Popover>
        <PopoverTrigger>
          <Button variant="outline">
            {value.length === 0
              ? `Select ${label}`
              : value.length === allIds.length
              ? `All ${label}`
              : `${value.length} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2">
          <ScrollArea className="h-48">
            {/* All Option */}
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                checked={value.length === allIds.length}
                onCheckedChange={toggleAll}
              />
              <span>All</span>
            </div>

            {/* Individual Options */}
            {options.map((o) => (
              <div key={o.id} className="flex items-center space-x-2 mb-1">
                <Checkbox
                  checked={value.includes(o.id)}
                  onCheckedChange={() => toggleOption(o.id)}
                />
                <span>{o.name}</span>
              </div>
            ))}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
