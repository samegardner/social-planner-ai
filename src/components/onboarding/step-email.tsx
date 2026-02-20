"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function StepEmail({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">What&apos;s your email?</h2>
      <p className="text-muted-foreground">
        This is where the AI will send you event suggestions.
      </p>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          placeholder="you@example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type="email"
        />
      </div>
    </div>
  );
}
