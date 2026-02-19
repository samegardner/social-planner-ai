export interface OnboardingState {
  homeAddress: string;
  likedNeighborhoods: string[];
  avoidedNeighborhoods: string[];
  maxBudget: number;
  activities: string[];
  hardNos: string;
  socialFrequency: number;
  availability: string[];
  friends: { name: string; phoneNumber: string }[];
  imessageNumber: string;
}

export interface Friend {
  id: number;
  name: string;
  phoneNumber: string;
  createdAt: string | null;
}

export interface PreferencesResponse extends OnboardingState {
  onboardingCompleted: boolean;
}
