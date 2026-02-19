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
      <h2 className="text-2xl font-semibold">What's your home address?</h2>
      <p className="text-muted-foreground">
        This helps us suggest events near you and calculate commute times.
      </p>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="123 Main St, Brooklyn, NY 11201"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
