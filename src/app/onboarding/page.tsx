"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { StepAddress } from "@/components/onboarding/step-address";
import { StepNeighborhoodsLike } from "@/components/onboarding/step-neighborhoods-like";
import { StepNeighborhoodsAvoid } from "@/components/onboarding/step-neighborhoods-avoid";
import { StepBudget } from "@/components/onboarding/step-budget";
import { StepActivities } from "@/components/onboarding/step-activities";
import { StepHardNos } from "@/components/onboarding/step-hard-nos";
import { StepSocialFrequency } from "@/components/onboarding/step-social-frequency";
import { StepAvailability } from "@/components/onboarding/step-availability";
import { StepFriends } from "@/components/onboarding/step-friends";
import { StepImessage } from "@/components/onboarding/step-imessage";
import { OnboardingState } from "@/types";

const TOTAL_STEPS = 10;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    homeAddress: "",
    likedNeighborhoods: [],
    avoidedNeighborhoods: [],
    maxBudget: 50,
    activities: [],
    hardNos: "",
    socialFrequency: 2,
    availability: [],
    friends: [{ name: "", phoneNumber: "" }],
    imessageNumber: "",
  });

  const update = <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (res.ok) {
        router.push("/preferences");
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepAddress value={state.homeAddress} onChange={(v) => update("homeAddress", v)} />;
      case 1:
        return <StepNeighborhoodsLike value={state.likedNeighborhoods} onChange={(v) => update("likedNeighborhoods", v)} />;
      case 2:
        return <StepNeighborhoodsAvoid value={state.avoidedNeighborhoods} likedNeighborhoods={state.likedNeighborhoods} onChange={(v) => update("avoidedNeighborhoods", v)} />;
      case 3:
        return <StepBudget value={state.maxBudget} onChange={(v) => update("maxBudget", v)} />;
      case 4:
        return <StepActivities value={state.activities} onChange={(v) => update("activities", v)} />;
      case 5:
        return <StepHardNos value={state.hardNos} onChange={(v) => update("hardNos", v)} />;
      case 6:
        return <StepSocialFrequency value={state.socialFrequency} onChange={(v) => update("socialFrequency", v)} />;
      case 7:
        return <StepAvailability value={state.availability} onChange={(v) => update("availability", v)} />;
      case 8:
        return <StepFriends value={state.friends} onChange={(v) => update("friends", v)} />;
      case 9:
        return <StepImessage value={state.imessageNumber} onChange={(v) => update("imessageNumber", v)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <ProgressBar current={step} total={TOTAL_STEPS} />

        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>

          {isLastStep ? (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? "Saving..." : "Finish"}
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don't worry, you can adjust all of this later.
        </p>
      </div>
    </div>
  );
}
