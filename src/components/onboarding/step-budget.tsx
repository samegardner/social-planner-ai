"use client";

import { Slider } from "@/components/ui/slider";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const BUDGET_LABELS = [
  { value: 25, label: "$25 - casual" },
  { value: 50, label: "$50 - nice dinner" },
  { value: 100, label: "$100 - big night" },
  { value: 150, label: "$150 - splurge" },
  { value: 200, label: "$200+ - sky's the limit" },
];

export function StepBudget({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">What's the most you'd want to spend on a night out?</h2>
      <p className="text-muted-foreground">
        Per person, roughly. We'll use this to filter suggestions.
      </p>
      <div className="space-y-8 pt-4">
        <div className="text-center">
          <span className="text-4xl font-bold">${value}</span>
          {value >= 200 && <span className="text-4xl font-bold">+</span>}
        </div>
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={10}
          max={200}
          step={5}
          className="w-full"
        />
        <div className="flex flex-wrap gap-2 justify-center">
          {BUDGET_LABELS.map((b) => (
            <button
              key={b.value}
              onClick={() => onChange(b.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                value === b.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
