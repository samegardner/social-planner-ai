"use client";

import { Slider } from "@/components/ui/slider";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const FREQUENCY_LABELS: Record<number, string> = {
  0: "Taking a break",
  1: "Low-key week",
  2: "Sweet spot",
  3: "Pretty social",
  4: "Very social",
  5: "Life of the party",
  6: "Every day's a party",
  7: "Nonstop",
};

export function StepSocialFrequency({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">How social do you want to be?</h2>
      <p className="text-muted-foreground">
        How many social events per week feels right? We'll aim for this number.
      </p>
      <div className="space-y-8 pt-4">
        <div className="text-center">
          <span className="text-4xl font-bold">{value}</span>
          <span className="text-lg text-muted-foreground ml-2">per week</span>
        </div>
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={0}
          max={7}
          step={1}
          className="w-full"
        />
        <p className="text-center text-muted-foreground">
          {FREQUENCY_LABELS[value] || ""}
        </p>
      </div>
    </div>
  );
}
