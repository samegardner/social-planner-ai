import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  preferences,
  activityPreferences,
  availability,
  friends,
} from "@/lib/schema";

export async function GET() {
  try {
    const prefs = db.select().from(preferences).limit(1).get();
    const activities = db.select().from(activityPreferences).all();
    const avail = db.select().from(availability).all();
    const friendsList = db.select().from(friends).all();

    return NextResponse.json({
      zipCode: prefs?.zipCode ?? "",
      hardNos: prefs?.hardNos ?? "",
      socialFrequency: prefs?.socialFrequency ?? 2,
      imessageNumber: prefs?.imessageNumber ?? "",
      onboardingCompleted: prefs?.onboardingCompleted ?? false,
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
      const scalarFields: Record<string, unknown> = {};
      if (data.zipCode !== undefined) scalarFields.zipCode = data.zipCode;
      if (data.hardNos !== undefined) scalarFields.hardNos = data.hardNos;
      if (data.socialFrequency !== undefined) scalarFields.socialFrequency = data.socialFrequency;
      if (data.imessageNumber !== undefined) scalarFields.imessageNumber = data.imessageNumber;

      if (Object.keys(scalarFields).length > 0) {
        scalarFields.updatedAt = new Date().toISOString();
        tx.update(preferences).set(scalarFields).run();
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
