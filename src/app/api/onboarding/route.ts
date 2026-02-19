import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { preferences, neighborhoods, activityPreferences, availability, friends } from "@/lib/schema";
import { OnboardingState } from "@/types";

export async function POST(request: Request) {
  try {
    const data: OnboardingState = await request.json();

    // Run everything in a transaction
    db.transaction((tx) => {
      // Upsert preferences
      const existing = tx.select().from(preferences).limit(1).get();
      if (existing) {
        tx.update(preferences)
          .set({
            homeAddress: data.homeAddress,
            maxBudget: data.maxBudget,
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
            homeAddress: data.homeAddress,
            maxBudget: data.maxBudget,
            hardNos: data.hardNos,
            socialFrequency: data.socialFrequency,
            imessageNumber: data.imessageNumber,
            onboardingCompleted: true,
          })
          .run();
      }

      // Replace neighborhoods
      tx.delete(neighborhoods).run();
      for (const name of data.likedNeighborhoods) {
        tx.insert(neighborhoods).values({ name, type: "like" }).run();
      }
      for (const name of data.avoidedNeighborhoods) {
        tx.insert(neighborhoods).values({ name, type: "avoid" }).run();
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding save error:", error);
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 });
  }
}
