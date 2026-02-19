"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function StepImessage({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">What's your iMessage number?</h2>
      <p className="text-muted-foreground">
        This is where the AI will text you with suggestions.
      </p>
      <div className="space-y-2">
        <Label htmlFor="imessage">Phone number</Label>
        <Input
          id="imessage"
          placeholder="+1 (555) 123-4567"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type="tel"
        />
      </div>
    </div>
  );
}
