import { db } from "@/lib/db";
import {
  preferences,
  neighborhoods,
  activityPreferences,
  availability,
} from "@/lib/schema";

export function getPreferences() {
  const prefs = db.select().from(preferences).limit(1).get();
  const hoods = db.select().from(neighborhoods).all();
  const activities = db.select().from(activityPreferences).all();
  const avail = db.select().from(availability).all();

  return {
    home_address: prefs?.homeAddress ?? "",
    max_budget: prefs?.maxBudget ?? 50,
    hard_nos: prefs?.hardNos ?? "",
    social_frequency: prefs?.socialFrequency ?? 2,
    liked_neighborhoods: hoods
      .filter((h) => h.type === "like")
      .map((h) => h.name),
    avoided_neighborhoods: hoods
      .filter((h) => h.type === "avoid")
      .map((h) => h.name),
    activities: activities.filter((a) => a.enabled).map((a) => a.activity),
    availability: avail.filter((a) => a.enabled).map((a) => a.slot),
  };
}
