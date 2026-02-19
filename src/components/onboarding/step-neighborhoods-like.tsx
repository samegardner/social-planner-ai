"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NYC_NEIGHBORHOODS } from "@/lib/constants";

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export function StepNeighborhoodsLike({ value, onChange }: Props) {
  const toggle = (neighborhood: string) => {
    if (value.includes(neighborhood)) {
      onChange(value.filter((n) => n !== neighborhood));
    } else {
      onChange([...value, neighborhood]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">What neighborhoods do you like hanging out in?</h2>
      <p className="text-muted-foreground">Select all that apply.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
        {NYC_NEIGHBORHOODS.map((hood) => (
          <Label
            key={hood}
            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              value.includes(hood)
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted"
            }`}
          >
            <Checkbox
              checked={value.includes(hood)}
              onCheckedChange={() => toggle(hood)}
            />
            <span className="text-sm">{hood}</span>
          </Label>
        ))}
      </div>
    </div>
  );
}
