"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NYC_NEIGHBORHOODS, ACTIVITY_TYPES, AVAILABILITY_SLOTS } from "@/lib/constants";
import { PreferencesResponse } from "@/types";

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<PreferencesResponse | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<PreferencesResponse>>({});
  const [friends, setFriends] = useState<{ id: number; name: string; phoneNumber: string }[]>([]);
  const [newFriend, setNewFriend] = useState({ name: "", phoneNumber: "" });

  useEffect(() => {
    fetchPreferences();
    fetchFriends();
  }, []);

  const fetchPreferences = async () => {
    const res = await fetch("/api/preferences");
    const data = await res.json();
    setPrefs(data);
  };

  const fetchFriends = async () => {
    const res = await fetch("/api/friends");
    const data = await res.json();
    setFriends(data);
  };

  const savePreferences = async (updates: Partial<PreferencesResponse>) => {
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await fetchPreferences();
    setEditing(null);
    setDraft({});
  };

  const startEdit = (section: string) => {
    setEditing(section);
    setDraft({});
  };

  const addFriend = async () => {
    if (!newFriend.name || !newFriend.phoneNumber) return;
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFriend),
    });
    setNewFriend({ name: "", phoneNumber: "" });
    await fetchFriends();
  };

  const deleteFriend = async (id: number) => {
    await fetch(`/api/friends?id=${id}`, { method: "DELETE" });
    await fetchFriends();
  };

  if (!prefs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Your Preferences</h1>
          <p className="text-muted-foreground mt-1">Adjust your social planner settings.</p>
        </div>

        {/* Home Address */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Home Address</CardTitle>
            {editing !== "address" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("address")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "address" ? (
              <div className="space-y-3">
                <Input
                  defaultValue={prefs.homeAddress}
                  onChange={(e) => setDraft({ homeAddress: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => savePreferences({ homeAddress: draft.homeAddress ?? prefs.homeAddress })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p>{prefs.homeAddress || "Not set"}</p>
            )}
          </CardContent>
        </Card>

        {/* Neighborhoods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Neighborhoods</CardTitle>
            {editing !== "neighborhoods" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("neighborhoods")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "neighborhoods" ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">You like:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {NYC_NEIGHBORHOODS.map((hood) => (
                      <Label key={hood} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={(draft.likedNeighborhoods ?? prefs.likedNeighborhoods).includes(hood)}
                          onCheckedChange={(checked) => {
                            const current = draft.likedNeighborhoods ?? [...prefs.likedNeighborhoods];
                            setDraft({
                              ...draft,
                              likedNeighborhoods: checked
                                ? [...current, hood]
                                : current.filter((n) => n !== hood),
                            });
                          }}
                        />
                        {hood}
                      </Label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2">You avoid:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {NYC_NEIGHBORHOODS.map((hood) => (
                      <Label key={hood} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={(draft.avoidedNeighborhoods ?? prefs.avoidedNeighborhoods).includes(hood)}
                          onCheckedChange={(checked) => {
                            const current = draft.avoidedNeighborhoods ?? [...prefs.avoidedNeighborhoods];
                            setDraft({
                              ...draft,
                              avoidedNeighborhoods: checked
                                ? [...current, hood]
                                : current.filter((n) => n !== hood),
                            });
                          }}
                        />
                        {hood}
                      </Label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => savePreferences({
                    likedNeighborhoods: draft.likedNeighborhoods ?? prefs.likedNeighborhoods,
                    avoidedNeighborhoods: draft.avoidedNeighborhoods ?? prefs.avoidedNeighborhoods,
                  })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Like: </span>
                  <span className="text-sm">
                    {prefs.likedNeighborhoods.length > 0
                      ? prefs.likedNeighborhoods.join(", ")
                      : "None selected"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Avoid: </span>
                  <span className="text-sm">
                    {prefs.avoidedNeighborhoods.length > 0
                      ? prefs.avoidedNeighborhoods.join(", ")
                      : "None selected"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Max Budget</CardTitle>
            {editing !== "budget" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("budget")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "budget" ? (
              <div className="space-y-4">
                <div className="text-center text-2xl font-bold">
                  ${draft.maxBudget ?? prefs.maxBudget}{(draft.maxBudget ?? prefs.maxBudget) >= 200 ? "+" : ""}
                </div>
                <Slider
                  value={[draft.maxBudget ?? prefs.maxBudget]}
                  onValueChange={(v) => setDraft({ ...draft, maxBudget: v[0] })}
                  min={10}
                  max={200}
                  step={5}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => savePreferences({ maxBudget: draft.maxBudget ?? prefs.maxBudget })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold">${prefs.maxBudget}{prefs.maxBudget >= 200 ? "+" : ""} per night</p>
            )}
          </CardContent>
        </Card>

        {/* Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Activities</CardTitle>
            {editing !== "activities" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("activities")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "activities" ? (
              <div className="space-y-3">
                {ACTIVITY_TYPES.map((activity) => {
                  const current = draft.activities ?? [...prefs.activities];
                  return (
                    <Label key={activity.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={current.includes(activity.id)}
                        onCheckedChange={(checked) => {
                          setDraft({
                            ...draft,
                            activities: checked
                              ? [...current, activity.id]
                              : current.filter((a) => a !== activity.id),
                          });
                        }}
                      />
                      <span>{activity.label}</span>
                      <span className="text-sm text-muted-foreground">- {activity.description}</span>
                    </Label>
                  );
                })}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => savePreferences({ activities: draft.activities ?? prefs.activities })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {prefs.activities.length > 0
                  ? prefs.activities.map((a) => {
                      const label = ACTIVITY_TYPES.find((t) => t.id === a)?.label ?? a;
                      return (
                        <span key={a} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {label}
                        </span>
                      );
                    })
                  : <span className="text-muted-foreground">None selected</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hard No's */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Hard No's</CardTitle>
            {editing !== "hardNos" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("hardNos")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "hardNos" ? (
              <div className="space-y-3">
                <Textarea
                  defaultValue={prefs.hardNos}
                  onChange={(e) => setDraft({ hardNos: e.target.value })}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => savePreferences({ hardNos: draft.hardNos ?? prefs.hardNos })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p>{prefs.hardNos || "None set"}</p>
            )}
          </CardContent>
        </Card>

        {/* Social Frequency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Social Frequency</CardTitle>
            {editing !== "frequency" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("frequency")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "frequency" ? (
              <div className="space-y-4">
                <div className="text-center text-2xl font-bold">
                  {draft.socialFrequency ?? prefs.socialFrequency} per week
                </div>
                <Slider
                  value={[draft.socialFrequency ?? prefs.socialFrequency]}
                  onValueChange={(v) => setDraft({ ...draft, socialFrequency: v[0] })}
                  min={0}
                  max={7}
                  step={1}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => savePreferences({ socialFrequency: draft.socialFrequency ?? prefs.socialFrequency })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold">{prefs.socialFrequency} events per week</p>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Availability</CardTitle>
            {editing !== "availability" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("availability")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "availability" ? (
              <div className="space-y-3">
                {AVAILABILITY_SLOTS.map((slot) => {
                  const current = draft.availability ?? [...prefs.availability];
                  return (
                    <Label key={slot.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={current.includes(slot.id)}
                        onCheckedChange={(checked) => {
                          setDraft({
                            ...draft,
                            availability: checked
                              ? [...current, slot.id]
                              : current.filter((s) => s !== slot.id),
                          });
                        }}
                      />
                      <span>{slot.label}</span>
                      <span className="text-sm text-muted-foreground">({slot.description})</span>
                    </Label>
                  );
                })}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => savePreferences({ availability: draft.availability ?? prefs.availability })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {prefs.availability.length > 0
                  ? prefs.availability.map((s) => {
                      const label = AVAILABILITY_SLOTS.find((slot) => slot.id === s)?.label ?? s;
                      return (
                        <span key={s} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {label}
                        </span>
                      );
                    })
                  : <span className="text-muted-foreground">None selected</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Friends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">{friend.name}</span>
                      <span className="text-muted-foreground ml-2">{friend.phoneNumber}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteFriend(friend.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No friends added yet.</p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Name"
                value={newFriend.name}
                onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Phone number"
                value={newFriend.phoneNumber}
                onChange={(e) => setNewFriend({ ...newFriend, phoneNumber: e.target.value })}
                className="flex-1"
              />
              <Button onClick={addFriend} disabled={!newFriend.name || !newFriend.phoneNumber}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* iMessage Number */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">iMessage Number</CardTitle>
            {editing !== "imessage" && (
              <Button variant="ghost" size="sm" onClick={() => startEdit("imessage")}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing === "imessage" ? (
              <div className="space-y-3">
                <Input
                  defaultValue={prefs.imessageNumber}
                  onChange={(e) => setDraft({ imessageNumber: e.target.value })}
                  type="tel"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => savePreferences({ imessageNumber: draft.imessageNumber ?? prefs.imessageNumber })}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p>{prefs.imessageNumber || "Not set"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
