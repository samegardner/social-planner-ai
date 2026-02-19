"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ACTIVITY_TYPES } from "@/lib/constants";

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export function StepActivities({ value, onChange }: Props) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((a) => a !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">What kinds of activities do you enjoy?</h2>
      <p className="text-muted-foreground">Select all that sound good to you.</p>
      <div className="space-y-3">
        {ACTIVITY_TYPES.map((activity) => (
          <Label
            key={activity.id}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              value.includes(activity.id)
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted"
            }`}
          >
            <Checkbox
              checked={value.includes(activity.id)}
              onCheckedChange={() => toggle(activity.id)}
              className="mt-0.5"
            />
            <div>
              <span className="font-medium">{activity.label}</span>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
            </div>
          </Label>
        ))}
      </div>
    </div>
  );
}
