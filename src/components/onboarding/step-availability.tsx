"use client";

import { AVAILABILITY_SLOTS } from "@/lib/constants";

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export function StepAvailability({ value, onChange }: Props) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((s) => s !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">When are you usually free for social stuff?</h2>
      <p className="text-muted-foreground">Select all that apply.</p>
      <div className="space-y-3">
        {AVAILABILITY_SLOTS.map((slot) => (
          <button
            key={slot.id}
            onClick={() => toggle(slot.id)}
            className={`w-full p-4 rounded-lg border text-left transition-colors ${
              value.includes(slot.id)
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted"
            }`}
          >
            <span className="font-medium">{slot.label}</span>
            <p className="text-sm text-muted-foreground">{slot.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
