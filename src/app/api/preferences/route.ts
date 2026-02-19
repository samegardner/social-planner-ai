import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  preferences,
  neighborhoods,
  activityPreferences,
  availability,
  friends,
} from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const prefs = db.select().from(preferences).limit(1).get();
    const hoods = db.select().from(neighborhoods).all();
    const activities = db.select().from(activityPreferences).all();
    const avail = db.select().from(availability).all();
    const friendsList = db.select().from(friends).all();

    return NextResponse.json({
      homeAddress: prefs?.homeAddress ?? "",
      maxBudget: prefs?.maxBudget ?? 50,
      hardNos: prefs?.hardNos ?? "",
      socialFrequency: prefs?.socialFrequency ?? 2,
      imessageNumber: prefs?.imessageNumber ?? "",
      onboardingCompleted: prefs?.onboardingCompleted ?? false,
      likedNeighborhoods: hoods.filter((h) => h.type === "like").map((h) => h.name),
      avoidedNeighborhoods: hoods.filter((h) => h.type === "avoid").map((h) => h.name),
      activities: activities.filter((a) => a.enabled).map((a) => a.activity),
      availability: avail.filter((a) => a.enabled).map((a) => a.slot),
      friends: friendsList,
    });
  } catch (error) {
    console.error("Preferences fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    db.transaction((tx) => {
      // Update scalar preferences if provided
      const scalarFields: Record<string, unknown> = {};
      if (data.homeAddress !== undefined) scalarFields.homeAddress = data.homeAddress;
      if (data.maxBudget !== undefined) scalarFields.maxBudget = data.maxBudget;
      if (data.hardNos !== undefined) scalarFields.hardNos = data.hardNos;
      if (data.socialFrequency !== undefined) scalarFields.socialFrequency = data.socialFrequency;
      if (data.imessageNumber !== undefined) scalarFields.imessageNumber = data.imessageNumber;

      if (Object.keys(scalarFields).length > 0) {
        scalarFields.updatedAt = new Date().toISOString();
        tx.update(preferences).set(scalarFields).run();
      }

      // Replace neighborhoods if provided
      if (data.likedNeighborhoods !== undefined || data.avoidedNeighborhoods !== undefined) {
        tx.delete(neighborhoods).run();
        if (data.likedNeighborhoods) {
          for (const name of data.likedNeighborhoods) {
            tx.insert(neighborhoods).values({ name, type: "like" }).run();
          }
        }
        if (data.avoidedNeighborhoods) {
          for (const name of data.avoidedNeighborhoods) {
            tx.insert(neighborhoods).values({ name, type: "avoid" }).run();
          }
        }
      }

      // Replace activities if provided
      if (data.activities !== undefined) {
        tx.delete(activityPreferences).run();
        for (const activity of data.activities) {
          tx.insert(activityPreferences).values({ activity, enabled: true }).run();
        }
      }

      // Replace availability if provided
      if (data.availability !== undefined) {
        tx.delete(availability).run();
        for (const slot of data.availability) {
          tx.insert(availability).values({ slot, enabled: true }).run();
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
