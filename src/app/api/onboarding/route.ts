import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { preferences, activityPreferences, availability, friends } from "@/lib/schema";
import { OnboardingState } from "@/types";
import { startAgent } from "@/lib/agent";
import { runScraper } from "@/lib/scraper";

export async function POST(request: Request) {
  try {
    const data: OnboardingState = await request.json();

    db.transaction((tx) => {
      const existing = tx.select().from(preferences).limit(1).get();
      if (existing) {
        tx.update(preferences)
          .set({
            zipCode: data.zipCode,
            hardNos: data.hardNos,
            socialFrequency: data.socialFrequency,
            imessageNumber: data.imessageNumber,
            onboardingCompleted: true,
            updatedAt: new Date().toISOString(),
          })
          .run();
      } else {
        tx.insert(preferences)
          .values({
            zipCode: data.zipCode,
            hardNos: data.hardNos,
            socialFrequency: data.socialFrequency,
            imessageNumber: data.imessageNumber,
            onboardingCompleted: true,
          })
          .run();
      }

      // Replace activity preferences
      tx.delete(activityPreferences).run();
      for (const activity of data.activities) {
        tx.insert(activityPreferences).values({ activity, enabled: true }).run();
      }

      // Replace availability
      tx.delete(availability).run();
      for (const slot of data.availability) {
        tx.insert(availability).values({ slot, enabled: true }).run();
      }

      // Replace friends
      tx.delete(friends).run();
      for (const friend of data.friends) {
        if (friend.name && friend.phoneNumber) {
          tx.insert(friends).values({ name: friend.name, phoneNumber: friend.phoneNumber }).run();
        }
      }
    });

    // Fire-and-forget: start agent and scrape events immediately
    startAgent().catch(console.error);
    runScraper().catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding save error:", error);
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 });
  }
}
