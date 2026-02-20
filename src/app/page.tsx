import { db } from "@/lib/db";
import { preferences } from "@/lib/schema";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home() {
  const prefs = db.select().from(preferences).limit(1).get();

  if (!prefs || !prefs.onboardingCompleted) {
    redirect("/onboarding");
  }

  redirect("/preferences");
}
