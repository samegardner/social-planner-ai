"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function StepHardNos({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Any hard no's?</h2>
      <p className="text-muted-foreground">
        Things you never want suggested. Be as specific or general as you want.
      </p>
      <div className="space-y-2">
        <Label htmlFor="hard-nos">Hard no's</Label>
        <Textarea
          id="hard-nos"
          placeholder="e.g., no karaoke, no Times Square, no sushi, nothing past midnight on weeknights..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
