"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NYC_NEIGHBORHOODS } from "@/lib/constants";

interface Props {
  value: string[];
  likedNeighborhoods: string[];
  onChange: (value: string[]) => void;
}

export function StepNeighborhoodsAvoid({ value, likedNeighborhoods, onChange }: Props) {
  const availableHoods = NYC_NEIGHBORHOODS.filter((h) => !likedNeighborhoods.includes(h));

  const toggle = (neighborhood: string) => {
    if (value.includes(neighborhood)) {
      onChange(value.filter((n) => n !== neighborhood));
    } else {
      onChange([...value, neighborhood]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Any neighborhoods you want to avoid?</h2>
      <p className="text-muted-foreground">
        We won't suggest events in these areas. Neighborhoods you already liked are hidden.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
        {availableHoods.map((hood) => (
          <Label
            key={hood}
            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              value.includes(hood)
                ? "bg-destructive/10 border-destructive"
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
