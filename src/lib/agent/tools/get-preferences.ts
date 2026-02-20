import { db } from "@/lib/db";
import {
  preferences,
  activityPreferences,
  availability,
} from "@/lib/schema";

export function getPreferences() {
  const prefs = db.select().from(preferences).limit(1).get();
  const activities = db.select().from(activityPreferences).all();
  const avail = db.select().from(availability).all();

  return {
    zip_code: prefs?.zipCode ?? "",
    hard_nos: prefs?.hardNos ?? "",
    social_frequency: prefs?.socialFrequency ?? 2,
    activities: activities.filter((a) => a.enabled).map((a) => a.activity),
    availability: avail.filter((a) => a.enabled).map((a) => a.slot),
  };
}
