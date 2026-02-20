"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function StepAddress({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">What's your zip code?</h2>
      <p className="text-muted-foreground">
        This helps us suggest events near you.
      </p>
      <div className="space-y-2">
        <Label htmlFor="zipcode">Zip code</Label>
        <Input
          id="zipcode"
          placeholder="10003"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={5}
          inputMode="numeric"
        />
      </div>
    </div>
  );
}
