"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FriendEntry {
  name: string;
  phoneNumber: string;
}

interface Props {
  value: FriendEntry[];
  onChange: (value: FriendEntry[]) => void;
}

export function StepFriends({ value, onChange }: Props) {
  const addFriend = () => {
    onChange([...value, { name: "", phoneNumber: "" }]);
  };

  const removeFriend = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateFriend = (index: number, field: keyof FriendEntry, val: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Who are your go-to friends to hang with?</h2>
      <p className="text-muted-foreground">
        Add their name and phone number so the AI can reach out on your behalf.
      </p>
      <div className="space-y-3">
        {value.map((friend, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Input
              placeholder="Name"
              value={friend.name}
              onChange={(e) => updateFriend(i, "name", e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Phone number"
              value={friend.phoneNumber}
              onChange={(e) => updateFriend(i, "phoneNumber", e.target.value)}
              className="flex-1"
            />
            {value.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFriend(i)}
                className="shrink-0"
              >
                ✕
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={addFriend} className="w-full">
        + Add another friend
      </Button>
    </div>
  );
}
